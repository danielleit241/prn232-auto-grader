using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;

namespace GradingSystem.Application.Services;

public class GradingJobService(IUnitOfWork unitOfWork) : IGradingJobService
{
    public async Task<GradingJobDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await unitOfWork.GradingJobs.GetByIdAsync(id);
        if (entity is null)
        {
            return null;
        }

        return new GradingJobDto
        {
            Id = entity.Id,
            SubmissionId = entity.SubmissionId,
            Status = entity.Status,
            ErrorMessage = entity.ErrorMessage,
            StartedAt = entity.StartedAt,
            FinishedAt = entity.FinishedAt
        };
    }
}
