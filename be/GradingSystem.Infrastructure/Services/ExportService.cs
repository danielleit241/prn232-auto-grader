using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;

namespace GradingSystem.Infrastructure.Services;

public class ExportService(IUnitOfWork uow) : IExportService
{
    public async Task<ExportJobDto> CreateAsync(CreateExportRequest req, CancellationToken ct = default)
    {
        var job = new ExportJob
        {
            AssignmentId = req.AssignmentId,
            Status       = ExportStatus.Pending,
        };

        await uow.ExportJobs.AddAsync(job);
        await uow.SaveChangesAsync(ct);

        return Map(job);
    }

    public async Task<string?> GetFilePathAsync(Guid exportJobId, CancellationToken ct = default)
    {
        var job = await uow.ExportJobs.GetByIdAsync(exportJobId);
        return job?.Status == ExportStatus.Done ? job.FilePath : null;
    }

    private static ExportJobDto Map(ExportJob e) => new()
    {
        Id           = e.Id,
        AssignmentId = e.AssignmentId,
        Status       = e.Status,
        FilePath     = e.FilePath,
        ErrorMessage = e.ErrorMessage,
    };
}
