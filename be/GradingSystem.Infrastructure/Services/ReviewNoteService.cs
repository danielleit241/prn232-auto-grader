using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;

namespace GradingSystem.Infrastructure.Services;

public class ReviewNoteService(IUnitOfWork unitOfWork) : IReviewNoteService
{
    public async Task<ReviewNoteDto> UpsertAsync(Guid submissionId, UpdateReviewNoteRequest req, CancellationToken ct = default)
    {
        _ = await unitOfWork.Submissions.GetByIdAsync(submissionId)
            ?? throw new NotFoundException($"Submission '{submissionId}' not found.");

        if (string.IsNullOrWhiteSpace(req.Content))
        {
            throw new BadRequestException("Content is required.");
        }

        var existing = (await unitOfWork.ReviewNotes.FindAsync(x => x.SubmissionId == submissionId)).FirstOrDefault();
        if (existing is null)
        {
            existing = new ReviewNote
            {
                SubmissionId = submissionId,
                Content = req.Content.Trim(),
                ReviewedBy = req.ReviewedBy?.Trim()
            };
            await unitOfWork.ReviewNotes.AddAsync(existing);
        }
        else
        {
            existing.Content = req.Content.Trim();
            existing.ReviewedBy = req.ReviewedBy?.Trim();
            unitOfWork.ReviewNotes.Update(existing);
        }

        await unitOfWork.SaveChangesAsync(ct);
        return Map(existing);
    }

    private static ReviewNoteDto Map(ReviewNote entity) => new()
    {
        Id = entity.Id,
        SubmissionId = entity.SubmissionId,
        Content = entity.Content,
        ReviewedBy = entity.ReviewedBy
    };
}
