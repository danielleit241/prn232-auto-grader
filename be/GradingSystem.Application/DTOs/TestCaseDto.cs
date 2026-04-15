namespace GradingSystem.Application.DTOs;

public class TestCaseDto
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string HttpMethod { get; set; } = string.Empty;
    public string UrlTemplate { get; set; } = string.Empty;
    public string? InputJson { get; set; }

    // ── Expect fields (typed) ────────────────────────────────────────────────
    public int? ExpectedStatus { get; set; }
    public bool? IsArray { get; set; }
    public List<string>? Fields { get; set; }
    public string? Value { get; set; }
    public string? Selector { get; set; }
    public string? SelectorText { get; set; }
    public int? SelectorMinCount { get; set; }

    public int Score { get; set; }
}
