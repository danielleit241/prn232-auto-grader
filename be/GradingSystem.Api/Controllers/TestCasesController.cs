using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class TestCasesController(ITestCaseService testCaseService) : BaseApiController
{
    [HttpPost("questions/{questionId:guid}/test-cases")]
    public async Task<IActionResult> CreateAsync(
        Guid questionId,
        [FromBody] List<CreateTestCaseRequest> reqs,
        CancellationToken ct)
    {
        if (reqs is null || reqs.Count == 0)
        {
            return BadRequest("At least one test case is required.");
        }

        var created = await testCaseService.CreateManyAsync(questionId, reqs, ct);
        return Ok(created, "Test cases created.");
    }

    [HttpGet("questions/{questionId:guid}/test-cases")]
    public async Task<IActionResult> GetByQuestionIdAsync(Guid questionId, CancellationToken ct)
    {
        var testCases = await testCaseService.GetByQuestionIdAsync(questionId, ct);
        return Ok(testCases);
    }
}
