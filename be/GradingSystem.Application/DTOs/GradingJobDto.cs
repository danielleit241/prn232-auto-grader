using GradingSystem.Domain.Entities;

namespace GradingSystem.Application.DTOs;

public class GradingJobDto
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public JobStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
}
