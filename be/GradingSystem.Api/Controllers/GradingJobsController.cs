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

        return Ok(new GradingJobDto
        {
            Id           = entity.Id,
            SubmissionId = entity.SubmissionId,
            Status       = entity.Status,
            ErrorMessage = entity.ErrorMessage,
            StartedAt    = entity.StartedAt,
            FinishedAt   = entity.FinishedAt,
        });
    }
}
