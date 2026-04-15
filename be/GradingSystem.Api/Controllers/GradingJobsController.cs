using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class GradingJobsController(IUnitOfWork uow) : BaseApiController
{
    [HttpGet("grading-jobs/{id:guid}")]
    public async Task<IActionResult> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var entity = await uow.GradingJobs.GetByIdAsync(id);
        if (entity is null)
            return NotFound($"GradingJob '{id}' not found.");

        return Ok(Map(entity));
    }

    [HttpGet("submissions/{submissionId:guid}/grading-jobs")]
    public async Task<IActionResult> GetBySubmissionAsync(Guid submissionId, CancellationToken ct)
    {
        var jobs = await uow.GradingJobs.FindAsync(j => j.SubmissionId == submissionId);
        return Ok(jobs.OrderByDescending(j => j.CreatedAt).Select(Map));
    }

    private static GradingJobDto Map(GradingSystem.Domain.Entities.GradingJob e) => new()
    {
        Id           = e.Id,
        SubmissionId = e.SubmissionId,
        Status       = e.Status,
        ErrorMessage = e.ErrorMessage,
        StartedAt    = e.StartedAt,
        FinishedAt   = e.FinishedAt,
    };
}
