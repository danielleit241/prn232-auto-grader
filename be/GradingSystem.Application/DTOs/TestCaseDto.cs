namespace GradingSystem.Application.DTOs;

public class TestCaseDto
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string HttpMethod { get; set; } = string.Empty;
    public string UrlTemplate { get; set; } = string.Empty;
    public string? InputJson { get; set; }
    public string ExpectJson { get; set; } = string.Empty;
    public int Score { get; set; }
}
