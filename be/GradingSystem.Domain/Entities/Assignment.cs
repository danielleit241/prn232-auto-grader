namespace GradingSystem.Domain.Entities;

public class Assignment : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    // File paths stored under /storage/assignments/{Id}/
    public string? DatabaseSqlPath { get; set; }   // Q1: database.sql

    // Shared URL used for all Q2 submissions in this assignment.
    public string? GivenApiBaseUrl { get; set; }

    public ICollection<Question> Questions { get; set; } = [];
    public ICollection<Submission> Submissions { get; set; } = [];
}
