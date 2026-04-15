using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class GradingJobsController(IGradingJobService gradingJobService) : BaseApiController
{
    [HttpGet("grading-jobs/{id:guid}")]
    public async Task<IActionResult> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var job = await gradingJobService.GetByIdAsync(id, ct);
        return job is null ? NotFound($"Grading job '{id}' not found.") : Ok(job);
    }
}
