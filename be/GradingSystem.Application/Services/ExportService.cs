using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;

namespace GradingSystem.Application.Services;

public class ExportService(IUnitOfWork uow) : IExportService
{
    public async Task<ExportJobDto> CreateAsync(CreateExportRequest req, CancellationToken ct = default)
    {
        var code = req.AssignmentCode.Trim().ToUpperInvariant();
        var assignments = await uow.Assignments.FindAsync(a => a.Code == code);
        var assignment = assignments.FirstOrDefault()
            ?? throw new NotFoundException($"Assignment '{code}' not found.");

        var job = new ExportJob
        {
            AssignmentId = assignment.Id,
            GradingRound = req.GradingRound?.Trim(),
            Status       = ExportStatus.Pending,
        };

        await uow.ExportJobs.AddAsync(job);
        await uow.SaveChangesAsync(ct);

        return Map(job, assignment.Code);
    }

    public async Task<string?> GetFilePathAsync(Guid exportJobId, CancellationToken ct = default)
    {
        var job = await uow.ExportJobs.GetByIdAsync(exportJobId);
        return job?.Status == ExportStatus.Done ? job.FilePath : null;
    }

    private static ExportJobDto Map(ExportJob e, string assignmentCode) => new()
    {
        Id             = e.Id,
        AssignmentId   = e.AssignmentId,
        AssignmentCode = assignmentCode,
        Status         = e.Status,
        FilePath       = e.FilePath,
        ErrorMessage   = e.ErrorMessage,
    };
}
