using System.ComponentModel.DataAnnotations;

namespace GradingSystem.Application.DTOs;

public class QuestionResultDto
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid QuestionId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public int Score { get; set; }
    public int MaxScore { get; set; }
    public int FinalScore { get; set; }
    public string? Detail { get; set; }
    public int? AdjustedScore { get; set; }
    public string? AdjustReason { get; set; }
    public string? AdjustedBy { get; set; }
    public DateTime? AdjustedAt { get; set; }
}

public class AdjustScoreRequest
{
    [Required]
    [Range(0, int.MaxValue)]
    public int AdjustedScore { get; set; }

    [Required]
    [MinLength(1)]
    [MaxLength(1000)]
    public string AdjustReason { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? AdjustedBy { get; set; }
}
