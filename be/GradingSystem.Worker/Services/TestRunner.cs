using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using GradingSystem.Application.Common;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;
using HtmlAgilityPack;

namespace GradingSystem.Worker.Services;

public class TestRunner(ILogger<TestRunner> logger)
{
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

            if (question.Type == QuestionType.Api)
                details = await RunApiCasesAsync(testCases, app.Port, client, ct);
            else
                details = await RunHttpCasesAsync(testCases, app.Port, client, ct);

            var existing = (await uow.QuestionResults.FindAsync(
                r => r.SubmissionId == job.SubmissionId && r.QuestionId == question.Id))
                .FirstOrDefault();
            if (existing != null)
                uow.QuestionResults.Remove(existing);

            int totalScore = details.Sum(r => r.AwardedScore);

            await uow.QuestionResults.AddAsync(new QuestionResult
            {
                SubmissionId = job.SubmissionId,
                QuestionId = question.Id,
                Score = totalScore,
                MaxScore = question.MaxScore,
                Detail = JsonSerializer.Serialize(details),
            });

            logger.LogInformation("Question {QuestionId}: {Score}/{Max}", question.Id, totalScore, question.MaxScore);
        }

        await uow.SaveChangesAsync(ct);
    }

    private async Task<List<TestCaseResult>> RunApiCasesAsync(
        List<TestCase> testCases, int port, HttpClient client, CancellationToken ct)
    {
        var swaggerUrl = $"http://localhost:{port}/swagger/v1/swagger.json";
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

        var results = new List<TestCaseResult>(testCases.Count);
        foreach (var tc in testCases)
        {
            var expect = JsonSerializer.Deserialize<ExpectJson>(tc.ExpectJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

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

    private static TestCaseResult EvaluateSwaggerCase(TestCase tc, JsonDocument swagger, string swaggerUrl)
    {
        var expect = JsonSerializer.Deserialize<ExpectJson>(tc.ExpectJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

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
        var url = $"http://localhost:{port}{tc.UrlTemplate}";
        var method = new HttpMethod(tc.HttpMethod.ToUpper());
        var request = new HttpRequestMessage(method, url);

        if (tc.InputJson != null)
        {
            if (method == HttpMethod.Get || method == HttpMethod.Delete)
                request.RequestUri = new Uri(url + "?" + JsonToQueryString(tc.InputJson));
            else
                request.Content = new StringContent(tc.InputJson, Encoding.UTF8, "application/json");
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

        var expect = JsonSerializer.Deserialize<ExpectJson>(tc.ExpectJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

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

    private static string JsonToQueryString(string inputJson)
    {
        var node = JsonNode.Parse(inputJson)?.AsObject();
        if (node == null) return string.Empty;
        return string.Join("&", node.Select(kv =>
            Uri.EscapeDataString(kv.Key) + "=" + Uri.EscapeDataString(kv.Value?.ToString() ?? "")));
    }
}
