namespace GradingSystem.Application.DTOs;

public class AssignmentDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DatabaseSqlPath { get; set; }
    public string? GivenApiBaseUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}
