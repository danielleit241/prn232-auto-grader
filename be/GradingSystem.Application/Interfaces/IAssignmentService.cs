using GradingSystem.Application.DTOs;

namespace GradingSystem.Application.Interfaces;

public interface IAssignmentService
{
    Task<AssignmentDto> CreateAsync(CreateAssignmentRequest req, CancellationToken ct = default);
    Task<AssignmentDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<AssignmentSummaryDto>> GetSummariesAsync(CancellationToken ct = default);

    Task<AssignmentDto> UpsertResourcesAsync(
        Guid id,
        UpsertAssignmentResourcesRequest request,
        CancellationToken ct = default);
}
