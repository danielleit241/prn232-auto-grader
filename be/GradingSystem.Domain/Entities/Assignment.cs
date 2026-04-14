namespace GradingSystem.Domain.Entities;

public class Assignment : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    // File paths stored under /storage/assignments/{Id}/
    public string? DatabaseSqlPath { get; set; }   // Q1: database.sql
    public string? GivenApiZipPath { get; set; }   // Q2: given-api.zip

    public ICollection<Question> Questions { get; set; } = [];
    public ICollection<Submission> Submissions { get; set; } = [];
}
