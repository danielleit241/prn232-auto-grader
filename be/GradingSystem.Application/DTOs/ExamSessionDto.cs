namespace GradingSystem.Application.DTOs;

public class ExamSessionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<AssignmentSummaryDto> Assignments { get; set; } = [];
}

public class ExamSessionSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateExamSessionRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class ParticipantDto
{
    public Guid Id { get; set; }
    public Guid ExamSessionId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public Guid AssignmentId { get; set; }
    public string AssignmentCode { get; set; } = string.Empty;
    public string AssignmentTitle { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ImportParticipantsResultDto
{
    public int Created { get; set; }
    public int Skipped { get; set; }
    public List<string> Errors { get; set; } = [];
}
