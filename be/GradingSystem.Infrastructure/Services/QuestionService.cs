using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;

namespace GradingSystem.Infrastructure.Services;

public class QuestionService(IUnitOfWork unitOfWork) : IQuestionService
{
    public async Task<IReadOnlyList<QuestionDto>> CreateManyAsync(
        Guid assignmentId,
        IReadOnlyList<CreateQuestionRequest> requests,
        CancellationToken ct = default)
    {
        if (requests.Count == 0)
        {
            throw new BadRequestException("At least one question is required.");
        }

        _ = await unitOfWork.Assignments.GetByIdAsync(assignmentId)
            ?? throw new NotFoundException($"Assignment '{assignmentId}' not found.");

        var normalizedArtifactNames = requests
            .Select(r => r.ArtifactFolderName.Trim())
            .ToList();
        var duplicateInPayload = normalizedArtifactNames
            .GroupBy(x => x, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(g => g.Count() > 1);
        if (duplicateInPayload is not null)
        {
            throw new BadRequestException(
                $"Duplicate artifactFolderName '{duplicateInPayload.Key}' found in request payload.");
        }

        var existingArtifacts = await unitOfWork.Questions.FindAsync(q => q.AssignmentId == assignmentId);
        var existingArtifactSet = existingArtifacts
            .Select(q => q.ArtifactFolderName)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var duplicateWithExisting = normalizedArtifactNames.FirstOrDefault(existingArtifactSet.Contains);
        if (!string.IsNullOrWhiteSpace(duplicateWithExisting))
        {
            throw new BadRequestException(
                $"artifactFolderName '{duplicateWithExisting}' already exists in assignment '{assignmentId}'.");
        }

        var created = new List<QuestionDto>(requests.Count);

        foreach (var req in requests)
        {
            var entity = new Question
            {
                AssignmentId = assignmentId,
                Title = req.Title.Trim(),
                Type = req.Type,
                MaxScore = req.MaxScore,
                ArtifactFolderName = req.ArtifactFolderName.Trim()
            };

            await unitOfWork.Questions.AddAsync(entity);
            created.Add(Map(entity));
        }

        await unitOfWork.SaveChangesAsync(ct);

        return created;
    }

    public async Task<IEnumerable<QuestionDto>> GetByAssignmentIdAsync(Guid assignmentId, CancellationToken ct = default)
    {
        var entities = await unitOfWork.Questions.FindAsync(q => q.AssignmentId == assignmentId);
        return entities.Select(Map);
    }

    private static QuestionDto Map(Question entity) => new()
    {
        Id = entity.Id,
        AssignmentId = entity.AssignmentId,
        Title = entity.Title,
        Type = entity.Type,
        MaxScore = entity.MaxScore,
        ArtifactFolderName = entity.ArtifactFolderName
    };
}
