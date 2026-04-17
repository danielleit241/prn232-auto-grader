using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class ExamSessionsController(
    IExamSessionService examSessionService,
    IBulkUploadService bulkUploadService) : BaseApiController
{
    [HttpPost("exam-sessions")]
    public async Task<IActionResult> CreateAsync([FromBody] CreateExamSessionRequest req, CancellationToken ct)
    {
        var created = await examSessionService.CreateAsync(req, ct);
        return Ok(created, "Exam session created.");
    }

    [HttpGet("exam-sessions")]
    public async Task<IActionResult> GetAllAsync(CancellationToken ct)
    {
        var sessions = await examSessionService.GetAllAsync(ct);
        return Ok(sessions);
    }

    [HttpGet("exam-sessions/{id:guid}")]
    public async Task<IActionResult> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var session = await examSessionService.GetByIdAsync(id, ct);
        return session is null ? NotFound($"ExamSession '{id}' not found.") : Ok(session);
    }

    [HttpDelete("exam-sessions/{id:guid}")]
    public async Task<IActionResult> DeleteAsync(Guid id, CancellationToken ct)
    {
        var deleted = await examSessionService.DeleteAsync(id, ct);
        return Ok(deleted, "Exam session deleted.");
    }

    [HttpPost("exam-sessions/{id:guid}/participants/import")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportParticipantsAsync(Guid id, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest("CSV file is required.");

        await using var stream = file.OpenReadStream();
        var result = await examSessionService.ImportParticipantsAsync(id, stream, ct);
        return Ok(result, $"Imported {result.Created} participant(s).");
    }

    [HttpGet("exam-sessions/{id:guid}/participants")]
    public async Task<IActionResult> GetParticipantsAsync(Guid id, CancellationToken ct)
    {
        var participants = await examSessionService.GetParticipantsAsync(id, ct);
        return Ok(participants);
    }

    [HttpPost("exam-sessions/{id:guid}/grade")]
    public async Task<IActionResult> TriggerGradeAsync(
        Guid id,
        [FromQuery] string gradingRound = "Lần 1",
        CancellationToken ct = default)
    {
        var count = await examSessionService.TriggerSessionGradeAsync(id, gradingRound, ct);
        return Ok(count, $"Enqueued {count} grading job(s) for round '{gradingRound}'.");
    }

    [HttpPost("exam-sessions/{id:guid}/bulk-upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> BulkUploadAsync(
        Guid id,
        IFormFile file,
        [FromForm] string gradingRound = "Lần 1",
        CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest("Master zip file is required.");

        await using var stream = file.OpenReadStream();
        var result = await bulkUploadService.ParseAndCreateAsync(id, gradingRound, stream, ct);
        return Ok(result, $"Bulk upload complete: {result.Created} created, {result.Missing} missing.");
    }
}
