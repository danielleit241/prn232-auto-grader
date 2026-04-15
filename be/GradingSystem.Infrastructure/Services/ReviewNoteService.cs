using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;

namespace GradingSystem.Infrastructure.Services;

public class ReviewNoteService(IUnitOfWork uow) : IReviewNoteService
{
    public async Task<ReviewNoteDto> UpsertAsync(Guid submissionId, UpdateReviewNoteRequest req, CancellationToken ct = default)
    {
        _ = await uow.Submissions.GetByIdAsync(submissionId)
            ?? throw new NotFoundException($"Submission '{submissionId}' not found.");

        var existing = (await uow.ReviewNotes.FindAsync(n => n.SubmissionId == submissionId))
                       .FirstOrDefault();

        if (existing is null)
        {
            existing = new ReviewNote
            {
                SubmissionId = submissionId,
                Content      = req.Content,
                ReviewedBy   = req.ReviewedBy,
            };
            await uow.ReviewNotes.AddAsync(existing);
        }
        else
        {
            existing.Content    = req.Content;
            existing.ReviewedBy = req.ReviewedBy;
            uow.ReviewNotes.Update(existing);
        }

        await uow.SaveChangesAsync(ct);

        return new ReviewNoteDto
        {
            Id           = existing.Id,
            SubmissionId = existing.SubmissionId,
            Content      = existing.Content,
            ReviewedBy   = existing.ReviewedBy,
        };
    }
}
