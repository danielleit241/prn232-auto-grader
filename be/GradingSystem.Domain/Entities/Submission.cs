namespace GradingSystem.Domain.Entities;

public enum SubmissionStatus { Pending, Grading, Done, Error }

public class Submission : BaseEntity
{
    public Guid AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public string StudentCode { get; set; } = string.Empty;
    public string ArtifactZipPath { get; set; } = string.Empty;  // /storage/submissions/{Id}/artifact.zip
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Pending;

    public ICollection<GradingJob> GradingJobs { get; set; } = [];
    public ICollection<QuestionResult> QuestionResults { get; set; } = [];
    public ReviewNote? ReviewNote { get; set; }
}
