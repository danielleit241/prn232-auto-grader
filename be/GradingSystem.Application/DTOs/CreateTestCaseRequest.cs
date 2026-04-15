using System.ComponentModel.DataAnnotations;

namespace GradingSystem.Application.DTOs;

public class CreateTestCaseRequest
{
    [Required]
    [MaxLength(10)]
    public string HttpMethod { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string UrlTemplate { get; set; } = string.Empty;

    /// <summary>Request body / query params as JSON object (optional).</summary>
    public string? InputJson { get; set; }

    // ── Expect fields (typed) ────────────────────────────────────────────────

    /// <summary>Expected HTTP status code.</summary>
    [Range(100, 599)]
    public int? ExpectedStatus { get; set; }

    /// <summary>Whether the JSON response should be an array.</summary>
    public bool? IsArray { get; set; }

    /// <summary>
    /// For Api questions: response schema must contain these property names.
    /// For Razor questions: JSON response body must contain these field names.
    /// </summary>
    public List<string>? Fields { get; set; }

    // ── Razor / HTML-specific ────────────────────────────────────────────────

    /// <summary>Text that must appear somewhere in the HTML response.</summary>
    public string? Value { get; set; }

    /// <summary>XPath/CSS selector that must match at least one element.</summary>
    public string? Selector { get; set; }

    /// <summary>Text the matched selector element must contain.</summary>
    public string? SelectorText { get; set; }

    /// <summary>Minimum number of elements the selector must match.</summary>
    [Range(1, 1000)]
    public int? SelectorMinCount { get; set; }

    [Range(1, int.MaxValue)]
    public int Score { get; set; }
}
