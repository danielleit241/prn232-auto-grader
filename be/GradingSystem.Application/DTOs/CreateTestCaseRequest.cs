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

    public string? InputJson { get; set; }

    [Required]
    public string ExpectJson { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Score { get; set; }
}
