using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class QuestionResultsController(IQuestionResultService questionResultService) : BaseApiController
{
    [HttpPut("question-results/{id:guid}/adjust")]
    public async Task<IActionResult> AdjustAsync(Guid id, [FromBody] AdjustScoreRequest req, CancellationToken ct)
    {
        var updated = await questionResultService.AdjustAsync(id, req, ct);
        return Ok(updated, "Question result adjusted.");
    }

    [HttpDelete("question-results/{id:guid}/adjust")]
    public async Task<IActionResult> ClearAdjustAsync(Guid id, CancellationToken ct)
    {
        var updated = await questionResultService.ClearAdjustAsync(id, ct);
        return Ok(updated, "Question result adjustment cleared.");
    }
}
