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
