using GradingSystem.Application.Common;
using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class SubmissionsController(
    ISubmissionService submissionService,
    IReviewNoteService reviewNoteService) : BaseApiController
{
    [HttpGet("assignments/{assignmentId:guid}/submissions")]
    public async Task<IActionResult> GetByAssignmentAsync(
        Guid assignmentId,
        [FromQuery] string? studentCode,
        CancellationToken ct)
    {
        var list = await submissionService.GetByAssignmentIdAsync(assignmentId, studentCode, ct);
        return Ok(list);
    }

    [HttpGet("submissions/{id:guid}")]
    public async Task<IActionResult> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var submission = await submissionService.GetByIdAsync(id, ct);
        return submission is null ? NotFound($"Submission '{id}' not found.") : Ok(submission);
    }

    [HttpPost("submissions/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAsync(
        [FromForm] Guid assignmentId,
        [FromForm] string studentCode,
        IFormFile? file,
        CancellationToken ct)
    {
        if (file is not { Length: > 0 })
            return BadRequest(ApiResponse.Fail("File is required."));

        await using var stream = file.OpenReadStream();
        var req = new UploadSubmissionRequest
        {
            AssignmentId = assignmentId,
            StudentCode  = studentCode,
            File         = (file.FileName, stream),
        };

        var created = await submissionService.UploadAsync(req, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse.Success(created, "Submission uploaded."));
    }

    [HttpPost("submissions/{id:guid}/grade")]
    public async Task<IActionResult> TriggerGradeAsync(Guid id, CancellationToken ct)
    {
        var job = await submissionService.TriggerGradeAsync(id, ct);
        return Ok(job, "Grading job created.");
    }

    [HttpGet("submissions/{id:guid}/results")]
    public async Task<IActionResult> GetResultsAsync(Guid id, CancellationToken ct)
    {
        var results = await submissionService.GetResultsAsync(id, ct);
        return Ok(results);
    }

    [HttpPut("submissions/{id:guid}/notes")]
    public async Task<IActionResult> UpsertNoteAsync(Guid id, [FromBody] UpdateReviewNoteRequest req, CancellationToken ct)
    {
        var note = await reviewNoteService.UpsertAsync(id, req, ct);
        return Ok(note, "Review note upserted.");
    }
}
