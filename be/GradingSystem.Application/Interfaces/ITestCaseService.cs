using GradingSystem.Application.DTOs;

namespace GradingSystem.Application.Interfaces;

public interface ITestCaseService
{
    Task<IReadOnlyList<TestCaseDto>> CreateManyAsync(
        Guid questionId,
        IReadOnlyList<CreateTestCaseRequest> requests,
        CancellationToken ct = default);
    Task<IEnumerable<TestCaseDto>> GetByQuestionIdAsync(Guid questionId, CancellationToken ct = default);
    Task<int> DeleteByQuestionIdAsync(Guid questionId, CancellationToken ct = default);
}
