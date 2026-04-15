using GradingSystem.Application.Common;
using GradingSystem.Application.DTOs;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace GradingSystem.Api.Controllers;

public class ExportsController(IExportService exportService, IUnitOfWork unitOfWork) : BaseApiController
{
    [HttpPost("exports")]
    public async Task<IActionResult> CreateAsync([FromBody] CreateExportRequest req, CancellationToken ct)
    {
        var created = await exportService.CreateAsync(req, ct);
        return StatusCode(StatusCodes.Status201Created, ApiResponse.Success(created, "Export job created."));
    }

    [HttpGet("exports/{id:guid}/download")]
    public async Task<IActionResult> DownloadAsync(Guid id, CancellationToken ct)
    {
        var job = await unitOfWork.ExportJobs.GetByIdAsync(id);
        if (job is null)
        {
            return NotFound($"Export job '{id}' not found.");
        }

        if (job.Status != ExportStatus.Done || string.IsNullOrWhiteSpace(job.FilePath))
        {
            return StatusCode(
                StatusCodes.Status409Conflict,
                ApiResponse.Fail("Export is not ready yet.", traceId: HttpContext.TraceIdentifier));
        }

        if (!System.IO.File.Exists(job.FilePath))
        {
            return NotFound($"Export file for job '{id}' not found.");
        }

        var fileName = Path.GetFileName(job.FilePath);
        return PhysicalFile(
            job.FilePath,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }
}
