using GradingSystem.Application.DTOs;

namespace GradingSystem.Application.Interfaces;

public interface IExportService
{
    Task<ExportJobDto> CreateAsync(CreateExportRequest req, CancellationToken ct = default);
    Task<string?> GetFilePathAsync(Guid exportJobId, CancellationToken ct = default);
}
