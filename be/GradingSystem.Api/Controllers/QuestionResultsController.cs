using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class QuestionResultsController(IUnitOfWork uow) : BaseApiController
{
    [HttpGet("question-results/{id:guid}")]
    public async Task<IActionResult> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var entity = await uow.QuestionResults.GetByIdAsync(id);
        if (entity is null)
            return NotFound($"QuestionResult '{id}' not found.");

        return Ok(MapDto(entity));
    }

    [HttpGet("submissions/{submissionId:guid}/question-results")]
    public async Task<IActionResult> GetBySubmissionAsync(Guid submissionId, CancellationToken ct)
    {
        var results = await uow.QuestionResults.FindAsync(r => r.SubmissionId == submissionId);
        return Ok(results.OrderBy(r => r.CreatedAt).Select(MapDto));
    }

    [HttpPut("question-results/{id:guid}/adjust")]
    public async Task<IActionResult> AdjustAsync(Guid id, [FromBody] AdjustScoreRequest req, CancellationToken ct)
    {
        var entity = await uow.QuestionResults.GetByIdAsync(id);
        if (entity is null)
            return NotFound($"QuestionResult '{id}' not found.");

        if (req.AdjustedScore < 0 || req.AdjustedScore > entity.MaxScore)
            return BadRequest($"AdjustedScore must be between 0 and {entity.MaxScore}.");

        entity.AdjustedScore = req.AdjustedScore;
        entity.AdjustReason = req.AdjustReason;
        entity.AdjustedBy = req.AdjustedBy;
        entity.AdjustedAt = DateTime.UtcNow;

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
        entity.AdjustReason = null;
        entity.AdjustedBy = null;
        entity.AdjustedAt = null;

        uow.QuestionResults.Update(entity);
        await uow.SaveChangesAsync(ct);

        return Ok(MapDto(entity));
    }

    private static QuestionResultDto MapDto(GradingSystem.Domain.Entities.QuestionResult r) => new()
    {
        Id = r.Id,
        SubmissionId = r.SubmissionId,
        QuestionId = r.QuestionId,
        Score = r.Score,
        MaxScore = r.MaxScore,
        FinalScore = r.FinalScore,
        Detail = r.Detail,
        AdjustedScore = r.AdjustedScore,
        AdjustReason = r.AdjustReason,
        AdjustedBy = r.AdjustedBy,
        AdjustedAt = r.AdjustedAt,
    };
}
