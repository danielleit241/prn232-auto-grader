using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
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
            CookieContainer   = new System.Net.CookieContainer(),
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

            var details    = new List<TestCaseResult>();
            int totalScore = 0;

            foreach (var tc in testCases)
            {
                var result = await RunTestCaseAsync(tc, app.Port, client, ct);
                details.Add(result);
                if (result.Pass) totalScore += tc.Score;
            }

            await uow.QuestionResults.AddAsync(new QuestionResult
            {
                SubmissionId = job.SubmissionId,
                QuestionId   = question.Id,
                Score        = totalScore,
                MaxScore     = question.MaxScore,
                Detail       = JsonSerializer.Serialize(details),
            });

            logger.LogInformation("Question {QuestionId}: {Score}/{Max}", question.Id, totalScore, question.MaxScore);
        }

        await uow.SaveChangesAsync(ct);
    }

    private static async Task<TestCaseResult> RunTestCaseAsync(
        TestCase tc, int port, HttpClient client, CancellationToken ct)
    {
        var url    = $"http://localhost:{port}{tc.UrlTemplate}";
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
            return new TestCaseResult
            {
                TestCaseId   = tc.Id,
                Pass         = false,
                AwardedScore = 0,
                HttpMethod   = tc.HttpMethod,
                Url          = url,
                ActualStatus = 0,
                FailReason   = $"Exception: {ex.Message}",
            };
        }

        var actualStatus = (int)response.StatusCode;
        var contentType  = response.Content.Headers.ContentType?.MediaType;
        var isJson = contentType == "application/json";
        var isHtml = contentType?.Contains("text/html") == true;

        var expect = JsonSerializer.Deserialize<ExpectJson>(tc.ExpectJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

        string? failReason = Evaluate(expect, actualStatus, body, isJson, isHtml);
        bool pass = failReason == null;

        return new TestCaseResult
        {
            TestCaseId   = tc.Id,
            Pass         = pass,
            AwardedScore = pass ? tc.Score : 0,
            HttpMethod   = tc.HttpMethod,
            Url          = url,
            ActualStatus = actualStatus,
            ActualBody   = body.Length > 500 ? body[..500] : body,
            FailReason   = failReason,
        };
    }

    private static string? Evaluate(ExpectJson expect, int actualStatus, string body, bool isJson, bool isHtml)
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
                var target  = root.ValueKind == JsonValueKind.Array ? root[0] : root;
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
                var nodes = doc.DocumentNode.SelectNodes(expect.Selector);

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
                    var node = doc.DocumentNode.SelectSingleNode(expect.Selector);
                    if (node?.InnerText.Contains(expect.SelectorText, StringComparison.OrdinalIgnoreCase) != true)
                        return $"SelectorText '{expect.SelectorText}' not found in element";
                }
            }
        }

        return null;
    }

    private static string JsonToQueryString(string inputJson)
    {
        var node = JsonNode.Parse(inputJson)?.AsObject();
        if (node == null) return string.Empty;
        return string.Join("&", node.Select(kv =>
            Uri.EscapeDataString(kv.Key) + "=" + Uri.EscapeDataString(kv.Value?.ToString() ?? "")));
    }
}

public class ExpectJson
{
    public int? Status { get; set; }
    public bool? IsArray { get; set; }
    public List<string>? Fields { get; set; }
    public string? Value { get; set; }
    public string? Selector { get; set; }
    public string? SelectorText { get; set; }
    public int? SelectorMinCount { get; set; }
}

public class TestCaseResult
{
    public Guid TestCaseId { get; set; }
    public bool Pass { get; set; }
    public int AwardedScore { get; set; }
    public string HttpMethod { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public int ActualStatus { get; set; }
    public string? ActualBody { get; set; }
    public string? FailReason { get; set; }
}
