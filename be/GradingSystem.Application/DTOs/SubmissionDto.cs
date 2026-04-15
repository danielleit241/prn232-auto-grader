using System.ComponentModel.DataAnnotations;
using GradingSystem.Domain.Entities;

namespace GradingSystem.Application.DTOs;

public class SubmissionDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string ArtifactZipPath { get; set; } = string.Empty;
    public SubmissionStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? TotalScore { get; set; }
    public int? MaxScore { get; set; }
}

public class UploadSubmissionRequest
{
    [Required]
    public Guid AssignmentId { get; set; }

    [Required]
    [MaxLength(20)]
    public string StudentCode { get; set; } = string.Empty;

    [Required]
    public (string FileName, Stream Content)? File { get; set; }
}
