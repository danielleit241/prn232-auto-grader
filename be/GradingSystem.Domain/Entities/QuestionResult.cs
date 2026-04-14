namespace GradingSystem.Domain.Entities;

public class QuestionResult : BaseEntity
{
    public Guid SubmissionId { get; set; }
    public Submission Submission { get; set; } = null!;

    public Guid QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public int Score { get; set; }
    public int MaxScore { get; set; }
    public string? Detail { get; set; }  // JSON array of per-test-case results
}
