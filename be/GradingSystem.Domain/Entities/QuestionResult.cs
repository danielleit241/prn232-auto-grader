namespace GradingSystem.Domain.Entities;

public class QuestionResult : BaseEntity
{
    public Guid SubmissionId { get; set; }
    public Submission Submission { get; set; } = null!;

    public Guid QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public int Score { get; set; }
    public int MaxScore { get; set; }
    public string? Detail { get; set; }        // JSON array of per-test-case results

    // Lecturer override
    public int? AdjustedScore { get; set; }    // null = dùng Score tự động
    public string? AdjustReason { get; set; }
    public string? AdjustedBy { get; set; }
    public DateTime? AdjustedAt { get; set; }

    public int FinalScore => AdjustedScore ?? Score;
}
