using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using GradingSystem.Application.Common;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;
using GradingSystem.Worker.Options;
using HtmlAgilityPack;
using Microsoft.Extensions.Options;

namespace GradingSystem.Worker.Services;

public class TestRunner(ILogger<TestRunner> logger, IOptions<WorkerOptions> workerOpts)
{
    private static readonly JsonSerializerOptions _jsonOpts =
        new(JsonSerializerDefaults.Web); // PropertyNameCaseInsensitive = true, no AOT issue

    private readonly NewmanLaunch? _newman = ResolveNewman(workerOpts.Value, logger);

    public async Task RunAsync(GradingJob job, StudentContext ctx, IUnitOfWork uow, CancellationToken ct)
    {
        var questions = (await uow.Questions.FindAsync(q => q.AssignmentId == job.Submission.AssignmentId))
                        .OrderBy(q => q.CreatedAt).ToList();

        var handler = new HttpClientHandler
        {
            CookieContainer = new System.Net.CookieContainer(),
            AllowAutoRedirect = false,
        };
        using var client = new HttpClient(handler);

        foreach (var question in questions)
        {
            if (!ctx.QuestionApps.TryGetValue(question.Id, out var app))
            {
                logger.LogWarning("No running app for question {QId} — skipping", question.Id);
                continue;
            }

            var testCases = (await uow.TestCases.FindAsync(tc => tc.QuestionId == question.Id))
                            .OrderBy(tc => tc.CreatedAt).ToList();

            List<TestCaseResult> details;

            if (app.GivenUrlInvalid)
            {
                // Student used wrong GivenApiBaseUrl → zero score for all test cases
                details = testCases.Select(tc => new TestCaseResult
                {
                    TestCaseId = tc.Id,
                    Pass = false,
                    AwardedScore = 0,
                    HttpMethod = tc.HttpMethod,
                    Url = tc.UrlTemplate,
                    ActualStatus = 0,
                    FailReason = app.GivenUrlInvalidReason,
                }).ToList();
            }
            else if (question.Type == QuestionType.Api)
                details = await RunApiCasesAsync(testCases, app.Port, client, ct);
            else
                details = await RunHttpCasesAsync(testCases, app.Port, client, ct);

            int totalScore = details.Sum(r => r.AwardedScore);

            await uow.QuestionResults.AddAsync(new QuestionResult
            {
                SubmissionId = job.SubmissionId,
                GradingJobId = job.Id,
                QuestionId   = question.Id,
                Score        = totalScore,
                MaxScore     = question.MaxScore,
                Detail       = JsonSerializer.Serialize(details),
            });

            logger.LogInformation("Question {QuestionId}: {Score}/{Max}", question.Id, totalScore, question.MaxScore);
        }

        await uow.SaveChangesAsync(ct);
    }

    // ── Q1: API question — newman for HTTP test cases, swagger for schema-only cases ──

    private async Task<List<TestCaseResult>> RunApiCasesAsync(
        List<TestCase> testCases, int port, HttpClient client, CancellationToken ct)
    {
        var swaggerUrl = $"http://127.0.0.1:{port}/swagger/v1/swagger.json";
        JsonDocument? swaggerDoc = null;
        string? fetchError = null;

        try
        {
            var resp = await client.GetAsync(swaggerUrl, ct);
            var body = await resp.Content.ReadAsStringAsync(ct);
            if (resp.IsSuccessStatusCode)
                swaggerDoc = JsonDocument.Parse(body);
            else
                fetchError = $"swagger.json returned HTTP {(int)resp.StatusCode}";
        }
        catch (Exception ex)
        {
            fetchError = $"Failed to fetch swagger.json: {ex.Message}";
        }

        logger.LogInformation("Swagger fetch {Url}: {Result}", swaggerUrl,
            swaggerDoc != null ? "OK" : fetchError);

        // Separate test cases: those with ExpectedBody use newman, others use existing logic
        var newmanCases = new List<TestCase>();
        var directCases = new List<TestCase>();

        foreach (var tc in testCases)
        {
            var expect = DeserializeExpect(tc.ExpectJson);
            bool hasBody = expect.Body.HasValue && expect.Body.Value.ValueKind != JsonValueKind.Undefined
                           && expect.Body.Value.ValueKind != JsonValueKind.Null;
            bool isHttpCase = expect.Status != null || tc.InputJson != null || hasBody;

            if (hasBody)
                newmanCases.Add(tc);
            else if (isHttpCase)
                directCases.Add(tc);
            else
                directCases.Add(tc); // swagger-only
        }

        var results = new List<TestCaseResult>(testCases.Count);

        // Run newman cases
        if (newmanCases.Count > 0)
        {
            var newmanResults = await RunNewmanCasesAsync(newmanCases, port, ct);
            results.AddRange(newmanResults);
        }

        // Run direct / swagger cases
        foreach (var tc in directCases)
        {
            var expect = DeserializeExpect(tc.ExpectJson);
            bool isHttpCase = expect.Status != null || tc.InputJson != null;

            if (isHttpCase)
                results.Add(await RunHttpTestCaseAsync(tc, port, client, ct));
            else if (swaggerDoc != null)
                results.Add(EvaluateSwaggerCase(tc, swaggerDoc, swaggerUrl));
            else
                results.Add(FailResult(tc, swaggerUrl, fetchError!));
        }

        return results;
    }

    // ── Newman runner ──

    private async Task<List<TestCaseResult>> RunNewmanCasesAsync(
        List<TestCase> testCases, int port, CancellationToken ct)
    {
        var collectionPath = Path.Combine(Path.GetTempPath(), $"newman-col-{Guid.NewGuid():N}.json");
        var reportPath     = Path.Combine(Path.GetTempPath(), $"newman-rep-{Guid.NewGuid():N}.json");

        try
        {
            if (_newman is null)
            {
                const string hint =
                    "Newman CLI not found. Install: npm install -g newman, ensure Node is on PATH, or set Worker:NewmanExecutable to the full path of newman.cmd.";
                return testCases.Select(tc =>
                        FailResult(tc, $"http://localhost:{port}{tc.UrlTemplate}", hint))
                    .ToList();
            }

            var collection = BuildPostmanCollection(testCases, port);
            await File.WriteAllTextAsync(collectionPath, collection, ct);

            var tail =
                $"run \"{collectionPath}\" --reporters json --reporter-json-export \"{reportPath}\" --timeout-request 10000";
            var args = _newman.Value.UseNpx ? $"--yes newman {tail}" : tail;
            var (exitCode, stdout, stderr) = await RunProcessAsync(_newman.Value.ExecutablePath, args, ct);

            logger.LogInformation("newman exit {Code}: {Stderr}", exitCode, stderr?.Length > 200 ? stderr[..200] : stderr);

            if (!File.Exists(reportPath))
                return testCases.Select(tc => FailResult(tc, $"http://localhost:{port}{tc.UrlTemplate}", "newman did not produce report")).ToList();

            var reportJson = await File.ReadAllTextAsync(reportPath, ct);
            return ParseNewmanReport(testCases, reportJson, port);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "newman failed");
            return testCases.Select(tc => FailResult(tc, $"http://localhost:{port}{tc.UrlTemplate}", $"newman error: {ex.Message}")).ToList();
        }
        finally
        {
            TryDelete(collectionPath);
            TryDelete(reportPath);
        }
    }

    private static string BuildPostmanCollection(List<TestCase> testCases, int port)
    {
        var items = new JsonArray();

        foreach (var tc in testCases)
        {
            var expect = DeserializeExpect(tc.ExpectJson);
            var url = $"http://127.0.0.1:{port}{tc.UrlTemplate}";

            var requestObj = new JsonObject
            {
                ["method"] = tc.HttpMethod.ToUpperInvariant(),
                ["header"] = new JsonArray
                {
                    new JsonObject { ["key"] = "Content-Type", ["value"] = "application/json" }
                },
                ["url"] = new JsonObject { ["raw"] = url }
            };

            if (tc.InputJson != null)
            {
                var method = tc.HttpMethod.ToUpperInvariant();
                if (method == "GET" || method == "DELETE")
                {
                    var qs = JsonToQueryString(tc.InputJson);
                    ((JsonObject)requestObj["url"]!)["raw"] = url + "?" + qs;
                }
                else
                {
                    requestObj["body"] = new JsonObject
                    {
                        ["mode"] = "raw",
                        ["raw"] = tc.InputJson
                    };
                }
            }
            else
            {
                var method = tc.HttpMethod.ToUpperInvariant();
                if (method == "POST" || method == "PUT" || method == "PATCH")
                {
                    requestObj["body"] = new JsonObject
                    {
                        ["mode"] = "raw",
                        ["raw"] = "{}"
                    };
                }
            }

            var tests = new StringBuilder();
            if (expect.Status.HasValue)
                tests.AppendLine($"pm.test('status {expect.Status}', () => pm.response.to.have.status({expect.Status}));");

            if (expect.Body.HasValue && expect.Body.Value.ValueKind != JsonValueKind.Undefined
                && expect.Body.Value.ValueKind != JsonValueKind.Null)
            {
                var expectedBodyJson = expect.Body.Value.GetRawText();
                tests.AppendLine($"pm.test('body match', function() {{");
                tests.AppendLine($"  var res = pm.response.json();");
                tests.AppendLine($"  var expected = {expectedBodyJson};");
                tests.AppendLine($"  pm.expect(JSON.stringify(res)).to.equal(JSON.stringify(expected));");
                tests.AppendLine($"}});");
            }

            var item = new JsonObject
            {
                ["name"] = tc.Name,
                ["request"] = requestObj,
                ["event"] = new JsonArray
                {
                    new JsonObject
                    {
                        ["listen"] = "test",
                        ["script"] = new JsonObject
                        {
                            ["exec"] = new JsonArray { tests.ToString() },
                            ["type"] = "text/javascript"
                        }
                    }
                }
            };

            items.Add(item);
        }

        var collection = new JsonObject
        {
            ["info"] = new JsonObject
            {
                ["name"] = "GradingCollection",
                ["schema"] = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            ["item"] = items
        };

        return collection.ToJsonString();
    }

    private static List<TestCaseResult> ParseNewmanReport(List<TestCase> testCases, string reportJson, int port)
    {
        var results = new List<TestCaseResult>(testCases.Count);

        try
        {
            using var doc = JsonDocument.Parse(reportJson);
            var root = doc.RootElement;

            // newman report: run.executions[]
            JsonElement executions = default;
            bool found = false;
            if (root.TryGetProperty("run", out var run) && run.TryGetProperty("executions", out executions))
                found = true;

            if (!found)
            {
                return testCases.Select(tc =>
                    FailResult(tc, $"http://localhost:{port}{tc.UrlTemplate}", "newman report missing executions")).ToList();
            }

            var executionList = executions.EnumerateArray().ToList();

            for (int i = 0; i < testCases.Count; i++)
            {
                var tc = testCases[i];
                var url = $"http://localhost:{port}{tc.UrlTemplate}";

                if (i >= executionList.Count)
                {
                    results.Add(FailResult(tc, url, "newman execution missing for this test case"));
                    continue;
                }

                var exec = executionList[i];
                int actualStatus = 0;
                string? actualBody = null;
                string? failReason = null;

                if (exec.TryGetProperty("response", out var resp))
                {
                    if (resp.TryGetProperty("code", out var code))
                        actualStatus = code.GetInt32();
                    if (resp.TryGetProperty("body", out var bodyEl))
                        actualBody = bodyEl.GetString();
                }

                // Collect test failures
                var failures = new List<string>();
                if (exec.TryGetProperty("assertions", out var assertions))
                {
                    foreach (var assertion in assertions.EnumerateArray())
                    {
                        if (assertion.TryGetProperty("error", out var err))
                        {
                            var msg = err.TryGetProperty("message", out var m) ? m.GetString() : "assertion failed";
                            failures.Add(msg ?? "assertion failed");
                        }
                    }
                }

                if (failures.Count > 0)
                    failReason = string.Join("; ", failures);

                bool pass = failReason == null;
                results.Add(new TestCaseResult
                {
                    TestCaseId = tc.Id,
                    Pass = pass,
                    AwardedScore = pass ? tc.Score : 0,
                    HttpMethod = tc.HttpMethod,
                    Url = url,
                    ActualStatus = actualStatus,
                    ActualBody = actualBody?.Length > 500 ? actualBody[..500] : actualBody,
                    FailReason = failReason,
                });
            }
        }
        catch (Exception ex)
        {
            return testCases.Select(tc =>
                FailResult(tc, $"http://localhost:{port}{tc.UrlTemplate}", $"parse newman report error: {ex.Message}")).ToList();
        }

        return results;
    }

    // ── Swagger schema-only cases ──

    private static TestCaseResult EvaluateSwaggerCase(TestCase tc, JsonDocument swagger, string swaggerUrl)
    {
        var expect = DeserializeExpect(tc.ExpectJson);
        var root = swagger.RootElement;

        if (!root.TryGetProperty("paths", out var paths))
            return FailResult(tc, swaggerUrl, "swagger.json has no 'paths'");

        if (!paths.TryGetProperty(tc.UrlTemplate, out var pathItem))
            return FailResult(tc, swaggerUrl, $"Path '{tc.UrlTemplate}' not found in swagger");

        var methodKey = tc.HttpMethod.ToLowerInvariant();
        if (!pathItem.TryGetProperty(methodKey, out var operation))
            return FailResult(tc, swaggerUrl, $"Method '{tc.HttpMethod}' not found for path '{tc.UrlTemplate}'");

        if (expect.Fields is { Count: > 0 })
        {
            var schemaError = CheckResponseSchema(root, operation, expect.Fields);
            if (schemaError != null)
                return FailResult(tc, swaggerUrl, schemaError);
        }

        return new TestCaseResult
        {
            TestCaseId = tc.Id,
            Pass = true,
            AwardedScore = tc.Score,
            HttpMethod = tc.HttpMethod,
            Url = $"{swaggerUrl} — {tc.HttpMethod} {tc.UrlTemplate}",
            ActualStatus = 200,
        };
    }

    private static string? CheckResponseSchema(JsonElement root, JsonElement operation, List<string> fields)
    {
        if (!operation.TryGetProperty("responses", out var responses)) return null;
        if (!responses.TryGetProperty("200", out var resp200)) return null;
        if (!resp200.TryGetProperty("content", out var content)) return null;

        JsonElement schema = default;
        bool found = false;

        foreach (var mediaType in content.EnumerateObject())
        {
            if (mediaType.Value.TryGetProperty("schema", out schema))
            {
                found = true;
                break;
            }
        }

        if (!found) return null;

        schema = ResolveRef(root, schema);

        if (schema.TryGetProperty("type", out var typeEl) && typeEl.GetString() == "array"
            && schema.TryGetProperty("items", out var items))
        {
            schema = ResolveRef(root, items);
        }

        if (!schema.TryGetProperty("properties", out var props)) return null;

        var missing = fields.Where(f => !props.TryGetProperty(f, out _)).ToList();
        return missing.Count > 0
            ? $"Response schema missing properties: {string.Join(", ", missing)}"
            : null;
    }

    private static JsonElement ResolveRef(JsonElement root, JsonElement schema)
    {
        if (!schema.TryGetProperty("$ref", out var refEl)) return schema;

        var parts = (refEl.GetString() ?? "").TrimStart('#', '/').Split('/');
        var current = root;

        foreach (var part in parts)
        {
            if (!current.TryGetProperty(part, out current)) return schema;
        }

        return current;
    }

    // ── Q2: Razor Pages — HTTP cases with id-based HTML checks ──

    private static async Task<List<TestCaseResult>> RunHttpCasesAsync(
        List<TestCase> testCases, int port, HttpClient client, CancellationToken ct)
    {
        var results = new List<TestCaseResult>(testCases.Count);
        foreach (var tc in testCases)
            results.Add(await RunHttpTestCaseAsync(tc, port, client, ct));
        return results;
    }

    private static async Task<TestCaseResult> RunHttpTestCaseAsync(
        TestCase tc, int port, HttpClient client, CancellationToken ct)
    {
        var url = $"http://127.0.0.1:{port}{tc.UrlTemplate}";
        var method = new HttpMethod(tc.HttpMethod.ToUpper());
        var request = new HttpRequestMessage(method, url);

        if (tc.InputJson != null)
        {
            if (method == HttpMethod.Get || method == HttpMethod.Delete)
                request.RequestUri = new Uri(url + "?" + JsonToQueryString(tc.InputJson));
            else
                request.Content = new StringContent(tc.InputJson, Encoding.UTF8, "application/json");
        }
        else if (method == HttpMethod.Post || method == HttpMethod.Put || method == HttpMethod.Patch)
        {
            request.Content = new StringContent("{}", Encoding.UTF8, "application/json");
        }

        HttpResponseMessage? response = null;
        string body = string.Empty;

        try
        {
            response = await client.SendAsync(request, ct);
            body = await response.Content.ReadAsStringAsync(ct);
        }
        catch (Exception ex)
        {
            return FailResult(tc, url, $"Exception: {ex.Message}");
        }

        var actualStatus = (int)response.StatusCode;
        var contentType = response.Content.Headers.ContentType?.MediaType;
        var isJson = contentType == "application/json";
        var isHtml = contentType?.Contains("text/html") == true;

        var expect = DeserializeExpect(tc.ExpectJson);

        string? failReason = EvaluateHttp(expect, actualStatus, body, isJson, isHtml);
        bool pass = failReason == null;

        return new TestCaseResult
        {
            TestCaseId = tc.Id,
            Pass = pass,
            AwardedScore = pass ? tc.Score : 0,
            HttpMethod = tc.HttpMethod,
            Url = url,
            ActualStatus = actualStatus,
            ActualBody = body.Length > 500 ? body[..500] : body,
            FailReason = failReason,
        };
    }

    private static string? EvaluateHttp(ExpectJson expect, int actualStatus, string body, bool isJson, bool isHtml)
    {
        if (expect.Status != null && actualStatus != expect.Status)
            return $"Expected status {expect.Status}, got {actualStatus}";

        if (isJson)
        {
            JsonElement root;
            try { root = JsonDocument.Parse(body).RootElement; }
            catch { return "Response is not valid JSON"; }

            if (expect.IsArray != null)
            {
                bool actualIsArray = root.ValueKind == JsonValueKind.Array;
                if (actualIsArray != expect.IsArray)
                    return $"Expected isArray={expect.IsArray}, got {(actualIsArray ? "array" : "object")}";
            }

            if (expect.Fields != null)
            {
                var target = root.ValueKind == JsonValueKind.Array ? root[0] : root;
                var missing = expect.Fields.Where(f => !target.TryGetProperty(f, out _)).ToList();
                if (missing.Count > 0)
                    return $"Missing fields: {string.Join(", ", missing)}";
            }
        }

        if (isHtml)
        {
            var doc = new HtmlDocument();
            doc.LoadHtml(body);

            if (expect.Value != null && !body.Contains(expect.Value, StringComparison.OrdinalIgnoreCase))
                return $"Value '{expect.Value}' not found in response";

            // id-based element check (new, replaces/supplements selector)
            if (expect.ElementId != null)
            {
                var node = doc.GetElementbyId(expect.ElementId);
                if (node == null)
                    return $"Element with id='{expect.ElementId}' not found";

                if (expect.ElementText != null
                    && !node.InnerText.Contains(expect.ElementText, StringComparison.OrdinalIgnoreCase))
                    return $"Element id='{expect.ElementId}' does not contain text '{expect.ElementText}'";
            }

            if (expect.Selector != null)
            {
                var xpath = expect.Selector.StartsWith('/')
                    ? expect.Selector
                    : "//" + expect.Selector.Trim().Replace(" ", "//");
                var nodes = doc.DocumentNode.SelectNodes(xpath);

                if (expect.SelectorMinCount != null)
                {
                    if (nodes == null || nodes.Count < expect.SelectorMinCount)
                        return $"Selector '{expect.Selector}' matched {nodes?.Count ?? 0}, expected >= {expect.SelectorMinCount}";
                }
                else if (nodes == null || nodes.Count == 0)
                {
                    return $"Selector '{expect.Selector}' not found";
                }

                if (expect.SelectorText != null)
                {
                    var node = doc.DocumentNode.SelectSingleNode(xpath);
                    if (node?.InnerText.Contains(expect.SelectorText, StringComparison.OrdinalIgnoreCase) != true)
                        return $"SelectorText '{expect.SelectorText}' not found in element";
                }
            }
        }

        return null;
    }

    // ── Helpers ──

    private static TestCaseResult FailResult(TestCase tc, string url, string reason) => new()
    {
        TestCaseId = tc.Id,
        Pass = false,
        AwardedScore = 0,
        HttpMethod = tc.HttpMethod,
        Url = url,
        ActualStatus = 0,
        FailReason = reason,
    };

    private static ExpectJson DeserializeExpect(string expectJson) =>
        JsonSerializer.Deserialize<ExpectJson>(expectJson, _jsonOpts)!;

    private static string JsonToQueryString(string inputJson)
    {
        var node = JsonNode.Parse(inputJson)?.AsObject();
        if (node == null) return string.Empty;
        return string.Join("&", node.Select(kv =>
            Uri.EscapeDataString(kv.Key) + "=" + Uri.EscapeDataString(kv.Value?.ToString() ?? "")));
    }

    private readonly struct NewmanLaunch(string executablePath, bool useNpx)
    {
        public string ExecutablePath { get; } = executablePath;
        public bool UseNpx { get; } = useNpx;
    }

    private static NewmanLaunch? ResolveNewman(WorkerOptions opts, ILogger logger)
    {
        var configured = opts.NewmanExecutable?.Trim();
        if (!string.IsNullOrEmpty(configured))
        {
            if (File.Exists(configured))
                return new NewmanLaunch(configured, false);
            logger.LogWarning(
                "Worker:NewmanExecutable '{Path}' not found — searching PATH / npx",
                configured);
        }

        var fromPath = FindExecutableOnPath("newman");
        if (fromPath is not null)
            return new NewmanLaunch(fromPath, false);

        if (OperatingSystem.IsWindows())
        {
            var appDataNpm = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "npm",
                "newman.cmd");
            if (File.Exists(appDataNpm))
                return new NewmanLaunch(appDataNpm, false);
        }

        var npx = FindExecutableOnPath("npx");
        if (npx is not null)
            return new NewmanLaunch(npx, true);

        if (OperatingSystem.IsWindows())
        {
            var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            var npxPf = Path.Combine(programFiles, "nodejs", "npx.cmd");
            if (File.Exists(npxPf))
                return new NewmanLaunch(npxPf, true);

            var pf86 = Environment.GetEnvironmentVariable("ProgramFiles(x86)");
            if (!string.IsNullOrEmpty(pf86))
            {
                var npx86 = Path.Combine(pf86, "nodejs", "npx.cmd");
                if (File.Exists(npx86))
                    return new NewmanLaunch(npx86, true);
            }
        }

        logger.LogWarning(
            "Newman not resolved: not on PATH, not under %AppData%\\npm, and npx not found.");
        return null;
    }

    private static string? FindExecutableOnPath(string nameWithoutExtension)
    {
        var path = Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrEmpty(path))
            return null;

        IEnumerable<string> names = OperatingSystem.IsWindows()
            ?
            [
                $"{nameWithoutExtension}.exe",
                $"{nameWithoutExtension}.cmd",
                $"{nameWithoutExtension}.bat",
                nameWithoutExtension,
            ]
            : [nameWithoutExtension, $"{nameWithoutExtension}.exe"];

        foreach (var segment in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var dir = segment.Trim().Trim('"');
            if (string.IsNullOrEmpty(dir))
                continue;

            foreach (var n in names)
            {
                var candidate = Path.Combine(dir, n);
                if (File.Exists(candidate))
                    return candidate;
            }
        }

        return null;
    }

    private static async Task<(int exitCode, string stdout, string stderr)> RunProcessAsync(
        string fileName, string arguments, CancellationToken ct)
    {
        var psi = new ProcessStartInfo(fileName, arguments)
        {
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using var process = Process.Start(psi)!;
        var stdout = await process.StandardOutput.ReadToEndAsync(ct);
        var stderr = await process.StandardError.ReadToEndAsync(ct);
        await process.WaitForExitAsync(ct);
        return (process.ExitCode, stdout, stderr);
    }

    private static void TryDelete(string path)
    {
        try { if (File.Exists(path)) File.Delete(path); } catch { /* best effort */ }
    }
}
