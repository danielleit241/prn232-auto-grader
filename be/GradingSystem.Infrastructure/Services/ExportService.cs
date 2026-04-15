using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;

namespace GradingSystem.Infrastructure.Services;

public class ExportService(IUnitOfWork unitOfWork) : IExportService
{
    public async Task<ExportJobDto> CreateAsync(CreateExportRequest req, CancellationToken ct = default)
    {
        if (req.AssignmentId == Guid.Empty)
        {
            throw new BadRequestException("AssignmentId is required.");
        }

        _ = await unitOfWork.Assignments.GetByIdAsync(req.AssignmentId)
            ?? throw new NotFoundException($"Assignment '{req.AssignmentId}' not found.");

        var job = new ExportJob
        {
            AssignmentId = req.AssignmentId,
            Status = ExportStatus.Pending
        };

        await unitOfWork.ExportJobs.AddAsync(job);
        await unitOfWork.SaveChangesAsync(ct);

        return Map(job);
    }

    public async Task<string?> GetFilePathAsync(Guid exportJobId, CancellationToken ct = default)
    {
        var job = await unitOfWork.ExportJobs.GetByIdAsync(exportJobId);
        return job?.Status == ExportStatus.Done ? job.FilePath : null;
    }

    private static ExportJobDto Map(ExportJob entity) => new()
    {
        Id = entity.Id,
        AssignmentId = entity.AssignmentId,
        Status = entity.Status,
        FilePath = entity.FilePath,
        ErrorMessage = entity.ErrorMessage
    };
}
