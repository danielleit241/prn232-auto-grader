using GradingSystem.Application.Common;
using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class SubmissionsController(
    ISubmissionService submissionService,
    IReviewNoteService reviewNoteService) : BaseApiController
{
    [HttpPost("submissions/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAsync(
        [FromForm] Guid assignmentId,
        [FromForm] string studentCode,
        IFormFile? file,
        CancellationToken ct)
    {
        Stream? fileStream = null;
        try
        {
            (string FileName, Stream Content)? filePart = null;
            if (file is { Length: > 0 })
            {
                fileStream = file.OpenReadStream();
                filePart = (file.FileName, fileStream);
            }

            var req = new UploadSubmissionRequest
            {
                AssignmentId = assignmentId,
                StudentCode = studentCode,
                File = filePart
            };

            var created = await submissionService.UploadAsync(req, ct);
            return StatusCode(StatusCodes.Status201Created, ApiResponse.Success(created, "Submission uploaded."));
        }
        finally
        {
            fileStream?.Dispose();
        }
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

using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class SubmissionsController(ISubmissionService svc, IReviewNoteService noteSvc) : BaseApiController
{
    [HttpPost("submissions/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAsync(
        [FromForm] Guid assignmentId,
        [FromForm] string studentCode,
        IFormFile file,
        CancellationToken ct)
    {
        if (file is not { Length: > 0 })
            return BadRequest("File is required.");

        await using var stream = file.OpenReadStream();
        var req = new UploadSubmissionRequest
        {
            AssignmentId = assignmentId,
            StudentCode = studentCode,
            File = (file.FileName, stream),
        };
        var result = await svc.UploadAsync(req, ct);
        return Ok(result, "Submission uploaded.");
    }

    [HttpPost("submissions/{id:guid}/grade")]
    public async Task<IActionResult> TriggerGradeAsync(Guid id, CancellationToken ct)
    {
        var submission = await svc.GetByIdAsync(id, ct);
        if (submission is null)
            return NotFound($"Submission '{id}' not found.");

        var job = await svc.TriggerGradeAsync(id, ct);
        return Ok(job, "Grading job created.");
    }

    [HttpGet("submissions/{id:guid}/results")]
    public async Task<IActionResult> GetResultsAsync(Guid id, CancellationToken ct)
    {
        var results = await svc.GetResultsAsync(id, ct);
        return Ok(results);
    }

    [HttpPut("submissions/{id:guid}/notes")]
    public async Task<IActionResult> UpsertNoteAsync(Guid id, [FromBody] UpdateReviewNoteRequest req, CancellationToken ct)
    {
        var note = await noteSvc.UpsertAsync(id, req, ct);
        return Ok(note);
    }
}
