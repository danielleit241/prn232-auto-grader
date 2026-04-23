namespace GradingSystem.Application.Common;

public class ExpectJson
{
    public int? Status { get; set; }
    public bool? IsArray { get; set; }
    public List<string>? Fields { get; set; }
    public string? Value { get; set; }
    public string? Selector { get; set; }
    public string? SelectorText { get; set; }
    public int? SelectorMinCount { get; set; }
    // Q1: exact JSON body comparison via newman
    public System.Text.Json.JsonElement? Body { get; set; }
    // Q2: check element existence/text by HTML id attribute
    public string? ElementId { get; set; }
    public string? ElementText { get; set; }
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
