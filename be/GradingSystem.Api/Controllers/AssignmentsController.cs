using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class AssignmentsController(IAssignmentService assignmentService) : BaseApiController
{
    [HttpPost("assignments")]
    public async Task<IActionResult> CreateAsync([FromBody] CreateAssignmentRequest req, CancellationToken ct)
    {
        var created = await assignmentService.CreateAsync(req, ct);
        return Ok(created, "Assignment created.");
    }

    [HttpGet("assignments/{id:guid}")]
    public async Task<IActionResult> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var assignment = await assignmentService.GetByIdAsync(id, ct);
        return assignment is null
            ? NotFound($"Assignment '{id}' not found.")
            : Ok(assignment);
    }

    [HttpGet("assignments")]
    public async Task<IActionResult> GetSummariesAsync(CancellationToken ct)
    {
        var assignments = await assignmentService.GetSummariesAsync(ct);
        return Ok(assignments);
    }

    [HttpPut("assignments/{id:guid}/resources")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpsertResourcesAsync(
        Guid id,
        IFormFile? databaseSql,
        [FromForm] string? givenApiBaseUrl,
        CancellationToken ct)
    {
        Stream? databaseSqlStream = null;
        try
        {
            (string FileName, Stream Content)? databaseSqlPart = null;
            if (databaseSql is { Length: > 0 })
            {
                databaseSqlStream = databaseSql.OpenReadStream();
                databaseSqlPart = (databaseSql.FileName, databaseSqlStream);
            }

            var updated = await assignmentService.UpsertResourcesAsync(
                id,
                new UpsertAssignmentResourcesRequest
                {
                    DatabaseSql = databaseSqlPart,
                    GivenApiBaseUrl = givenApiBaseUrl
                },
                ct);

            return Ok(updated, "Assignment resources updated.");
        }
        finally
        {
            databaseSqlStream?.Dispose();
        }
    }
}
