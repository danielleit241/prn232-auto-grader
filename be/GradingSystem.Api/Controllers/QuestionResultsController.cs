using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class QuestionResultsController(IUnitOfWork uow) : BaseApiController
{
    [HttpPut("question-results/{id:guid}/adjust")]
    public async Task<IActionResult> AdjustAsync(Guid id, [FromBody] AdjustScoreRequest req, CancellationToken ct)
    {
        var entity = await uow.QuestionResults.GetByIdAsync(id);
        if (entity is null)
            return NotFound($"QuestionResult '{id}' not found.");

        if (req.AdjustedScore < 0 || req.AdjustedScore > entity.MaxScore)
            return BadRequest($"AdjustedScore must be between 0 and {entity.MaxScore}.");

        entity.AdjustedScore = req.AdjustedScore;
        entity.AdjustReason  = req.AdjustReason;
        entity.AdjustedBy    = req.AdjustedBy;
        entity.AdjustedAt    = DateTime.UtcNow;

        uow.QuestionResults.Update(entity);
        await uow.SaveChangesAsync(ct);

        return Ok(MapDto(entity));
    }

    [HttpDelete("question-results/{id:guid}/adjust")]
    public async Task<IActionResult> ClearAdjustAsync(Guid id, CancellationToken ct)
    {
        var entity = await uow.QuestionResults.GetByIdAsync(id);
        if (entity is null)
            return NotFound($"QuestionResult '{id}' not found.");

        entity.AdjustedScore = null;
        entity.AdjustReason  = null;
        entity.AdjustedBy    = null;
        entity.AdjustedAt    = null;

        uow.QuestionResults.Update(entity);
        await uow.SaveChangesAsync(ct);

        return Ok(MapDto(entity));
    }

    private static QuestionResultDto MapDto(GradingSystem.Domain.Entities.QuestionResult r) => new()
    {
        Id            = r.Id,
        SubmissionId  = r.SubmissionId,
        QuestionId    = r.QuestionId,
        Score         = r.Score,
        MaxScore      = r.MaxScore,
        FinalScore    = r.FinalScore,
        Detail        = r.Detail,
        AdjustedScore = r.AdjustedScore,
        AdjustReason  = r.AdjustReason,
        AdjustedBy    = r.AdjustedBy,
        AdjustedAt    = r.AdjustedAt,
    };
}
