namespace GradingSystem.Domain.Entities;

public enum QuestionType { Api, Razor }

public class Question : BaseEntity
{
    public Guid AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public QuestionType Type { get; set; }   // Api = Q1, Razor = Q2
    public int MaxScore { get; set; }

    public ICollection<TestCase> TestCases { get; set; } = [];
}
