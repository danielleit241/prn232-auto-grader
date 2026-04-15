namespace GradingSystem.Application.DTOs;

public sealed class UpsertAssignmentResourcesRequest
{
    public (string FileName, Stream Content)? DatabaseSql { get; init; }
    public string? GivenApiBaseUrl { get; init; }
}
