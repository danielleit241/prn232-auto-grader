using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;

namespace GradingSystem.Infrastructure.Services;

public class TestCaseService(IUnitOfWork unitOfWork) : ITestCaseService
{
    private static readonly HashSet<string> AllowedHttpMethods = new(StringComparer.Ordinal)
    {
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "HEAD",
        "OPTIONS",
    };

    public async Task<IReadOnlyList<TestCaseDto>> CreateManyAsync(
        Guid questionId,
        IReadOnlyList<CreateTestCaseRequest> requests,
        CancellationToken ct = default)
    {
        if (requests.Count == 0)
        {
            throw new BadRequestException("At least one test case is required.");
        }

        var question = await unitOfWork.Questions.GetByIdAsync(questionId)
            ?? throw new NotFoundException($"Question '{questionId}' not found.");

        if (question.Type != QuestionType.Razor)
        {
            throw new BadRequestException("Test cases in this API are only supported for Razor questions.");
        }

        var created = new List<TestCaseDto>(requests.Count);

        foreach (var req in requests)
        {
            var normalizedMethod = req.HttpMethod.Trim().ToUpperInvariant();
            if (!AllowedHttpMethods.Contains(normalizedMethod))
            {
                throw new BadRequestException(
                    $"HttpMethod '{req.HttpMethod}' is not supported. Allowed values: {string.Join(", ", AllowedHttpMethods)}."
                );
            }

            var entity = new TestCase
            {
                QuestionId = questionId,
                Name = BuildName(req.HttpMethod, req.UrlTemplate),
                HttpMethod = normalizedMethod,
                UrlTemplate = req.UrlTemplate.Trim(),
                InputJson = req.InputJson?.Trim(),
                ExpectJson = req.ExpectJson.Trim(),
                Score = req.Score,
            };

            await unitOfWork.TestCases.AddAsync(entity);
            created.Add(Map(entity));
        }

        await unitOfWork.SaveChangesAsync(ct);

        return created;
    }

    public async Task<IEnumerable<TestCaseDto>> GetByQuestionIdAsync(
        Guid questionId,
        CancellationToken ct = default
    )
    {
        var entities = await unitOfWork.TestCases.FindAsync(t => t.QuestionId == questionId);
        return entities.Select(Map);
    }

    private static string BuildName(string httpMethod, string urlTemplate)
    {
        var generated = $"{httpMethod.Trim().ToUpperInvariant()} {urlTemplate.Trim()}";
        return generated.Length <= 100 ? generated : generated[..100];
    }

    private static TestCaseDto Map(TestCase entity) =>
        new()
        {
            Id = entity.Id,
            QuestionId = entity.QuestionId,
            Name = entity.Name,
            HttpMethod = entity.HttpMethod,
            UrlTemplate = entity.UrlTemplate,
            InputJson = entity.InputJson,
            ExpectJson = entity.ExpectJson,
            Score = entity.Score,
        };
}
