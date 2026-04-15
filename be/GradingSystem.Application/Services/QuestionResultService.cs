using System.Text.RegularExpressions;
using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;

namespace GradingSystem.Application.Services;

public class QuestionResultService(IUnitOfWork unitOfWork) : IQuestionResultService
{
    private static readonly Regex StudentIdRegex = new(@"[a-zA-Z]{2}\d{6}", RegexOptions.Compiled);

    public async Task<QuestionResultDto> AdjustAsync(Guid id, AdjustScoreRequest req, CancellationToken ct = default)
    {
        var result = await unitOfWork.QuestionResults.GetByIdAsync(id)
            ?? throw new NotFoundException($"QuestionResult '{id}' not found.");

        if (req.AdjustedScore < 0 || req.AdjustedScore > result.MaxScore)
        {
            throw new BadRequestException($"AdjustedScore must be in range [0..{result.MaxScore}].");
        }

        if (string.IsNullOrWhiteSpace(req.AdjustReason))
        {
            throw new BadRequestException("AdjustReason is required.");
        }

        result.AdjustedScore = req.AdjustedScore;
        result.AdjustReason = req.AdjustReason.Trim();
        result.AdjustedBy = req.AdjustedBy?.Trim();
        result.AdjustedAt = DateTime.UtcNow;

        unitOfWork.QuestionResults.Update(result);
        await unitOfWork.SaveChangesAsync(ct);

        return await BuildDtoAsync(result);
    }

    public async Task<QuestionResultDto> ClearAdjustAsync(Guid id, CancellationToken ct = default)
    {
        var result = await unitOfWork.QuestionResults.GetByIdAsync(id)
            ?? throw new NotFoundException($"QuestionResult '{id}' not found.");

        result.AdjustedScore = null;
        result.AdjustReason = null;
        result.AdjustedBy = null;
        result.AdjustedAt = null;

        unitOfWork.QuestionResults.Update(result);
        await unitOfWork.SaveChangesAsync(ct);

        return await BuildDtoAsync(result);
    }

    private async Task<QuestionResultDto> BuildDtoAsync(Domain.Entities.QuestionResult entity)
    {
        var submission = await unitOfWork.Submissions.GetByIdAsync(entity.SubmissionId)
            ?? throw new NotFoundException($"Submission '{entity.SubmissionId}' not found.");

        var studentId = ParseStudentId(submission.StudentCode);
        return new QuestionResultDto
        {
            Id = entity.Id,
            SubmissionId = entity.SubmissionId,
            QuestionId = entity.QuestionId,
            StudentCode = submission.StudentCode,
            StudentId = studentId,
            Score = entity.Score,
            MaxScore = entity.MaxScore,
            FinalScore = entity.FinalScore,
            Detail = entity.Detail,
            AdjustedScore = entity.AdjustedScore,
            AdjustReason = entity.AdjustReason,
            AdjustedBy = entity.AdjustedBy,
            AdjustedAt = entity.AdjustedAt
        };
    }

    private static string ParseStudentId(string code)
    {
        var match = StudentIdRegex.Match(code);
        return match.Success ? match.Value : code;
    }
}
