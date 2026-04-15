using System.Text.Json;
using System.Text.Json.Serialization;
using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;

namespace GradingSystem.Application.Services;

public class TestCaseService(IUnitOfWork unitOfWork) : ITestCaseService
{
    private static readonly HashSet<string> AllowedHttpMethods = new(StringComparer.Ordinal)
    {
        "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS",
    };

    private static readonly JsonSerializerOptions SerializerOpts = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
    };

    public async Task<IReadOnlyList<TestCaseDto>> CreateManyAsync(
        Guid questionId,
        IReadOnlyList<CreateTestCaseRequest> requests,
        CancellationToken ct = default)
    {
        if (requests.Count == 0)
            throw new BadRequestException("At least one test case is required.");

        _ = await unitOfWork.Questions.GetByIdAsync(questionId)
            ?? throw new NotFoundException($"Question '{questionId}' not found.");

        var created = new List<TestCaseDto>(requests.Count);

        foreach (var req in requests)
        {
            var normalizedMethod = req.HttpMethod.Trim().ToUpperInvariant();
            if (!AllowedHttpMethods.Contains(normalizedMethod))
                throw new BadRequestException(
                    $"HttpMethod '{req.HttpMethod}' is not supported. Allowed values: {string.Join(", ", AllowedHttpMethods)}.");

            var entity = new TestCase
            {
                QuestionId  = questionId,
                Name        = BuildName(normalizedMethod, req.UrlTemplate),
                HttpMethod  = normalizedMethod,
                UrlTemplate = req.UrlTemplate.Trim(),
                InputJson   = req.InputJson?.Trim(),
                ExpectJson  = SerializeExpect(req),
                Score       = req.Score,
            };

            await unitOfWork.TestCases.AddAsync(entity);
            created.Add(Map(entity));
        }

        await unitOfWork.SaveChangesAsync(ct);

        return created;
    }

    public async Task<IEnumerable<TestCaseDto>> GetByQuestionIdAsync(Guid questionId, CancellationToken ct = default)
    {
        var entities = await unitOfWork.TestCases.FindAsync(t => t.QuestionId == questionId);
        return entities.OrderBy(t => t.CreatedAt).Select(Map);
    }

    public async Task<int> DeleteByQuestionIdAsync(Guid questionId, CancellationToken ct = default)
    {
        _ = await unitOfWork.Questions.GetByIdAsync(questionId)
            ?? throw new NotFoundException($"Question '{questionId}' not found.");

        var existing = (await unitOfWork.TestCases.FindAsync(t => t.QuestionId == questionId)).ToList();
        foreach (var tc in existing)
            unitOfWork.TestCases.Remove(tc);

        await unitOfWork.SaveChangesAsync(ct);
        return existing.Count;
    }

    private static string BuildName(string httpMethod, string urlTemplate)
    {
        var generated = $"{httpMethod} {urlTemplate.Trim()}";
        return generated.Length <= 100 ? generated : generated[..100];
    }

    private static string SerializeExpect(CreateTestCaseRequest req) =>
        JsonSerializer.Serialize(new
        {
            status           = req.ExpectedStatus,
            isArray          = req.IsArray,
            fields           = req.Fields,
            value            = req.Value,
            selector         = req.Selector,
            selectorText     = req.SelectorText,
            selectorMinCount = req.SelectorMinCount,
        }, SerializerOpts);

    private static TestCaseDto Map(TestCase entity)
    {
        var dto = new TestCaseDto
        {
            Id          = entity.Id,
            QuestionId  = entity.QuestionId,
            Name        = entity.Name,
            HttpMethod  = entity.HttpMethod,
            UrlTemplate = entity.UrlTemplate,
            InputJson   = entity.InputJson,
            Score       = entity.Score,
        };

        if (string.IsNullOrWhiteSpace(entity.ExpectJson)) return dto;

        try
        {
            using var doc = JsonDocument.Parse(entity.ExpectJson);
            var root = doc.RootElement;

            if (root.TryGetProperty("status", out var s) && s.ValueKind != JsonValueKind.Null)
                dto.ExpectedStatus = s.GetInt32();

            if (root.TryGetProperty("isArray", out var a) && a.ValueKind != JsonValueKind.Null)
                dto.IsArray = a.GetBoolean();

            if (root.TryGetProperty("fields", out var f) && f.ValueKind == JsonValueKind.Array)
                dto.Fields = f.EnumerateArray().Select(x => x.GetString()!).ToList();

            if (root.TryGetProperty("value", out var v) && v.ValueKind != JsonValueKind.Null)
                dto.Value = v.GetString();

            if (root.TryGetProperty("selector", out var sel) && sel.ValueKind != JsonValueKind.Null)
                dto.Selector = sel.GetString();

            if (root.TryGetProperty("selectorText", out var st) && st.ValueKind != JsonValueKind.Null)
                dto.SelectorText = st.GetString();

            if (root.TryGetProperty("selectorMinCount", out var smc) && smc.ValueKind != JsonValueKind.Null)
                dto.SelectorMinCount = smc.GetInt32();
        }
        catch { /* ignore malformed stored JSON */ }

        return dto;
    }
}
