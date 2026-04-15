using GradingSystem.Domain.Entities;

namespace GradingSystem.Application.DTOs;

public class SubmissionDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public SubmissionStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UploadSubmissionRequest
{
    public Guid AssignmentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public required (string FileName, Stream Content) File { get; set; }
}
