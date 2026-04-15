using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace GradingSystem.Application.Services;

public class AssignmentService(IUnitOfWork unitOfWork, IConfiguration configuration) : IAssignmentService
{
    private readonly string _storageBasePath = configuration["Storage:BasePath"] ?? "/storage";

    public async Task<AssignmentDto> CreateAsync(CreateAssignmentRequest req, CancellationToken ct = default)
    {
        var entity = new Assignment
        {
            Title       = req.Title.Trim(),
            Description = req.Description?.Trim(),
        };

        await unitOfWork.Assignments.AddAsync(entity);
        await unitOfWork.SaveChangesAsync(ct);

        return Map(entity);
    }

    public async Task<AssignmentDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await unitOfWork.Assignments.GetByIdAsync(id);
        return entity is null ? null : Map(entity);
    }

    public async Task<IReadOnlyList<AssignmentSummaryDto>> GetSummariesAsync(CancellationToken ct = default)
    {
        var entities = await unitOfWork.Assignments.GetAllAsync();
        return entities
            .Select(e => new AssignmentSummaryDto
            {
                Id          = e.Id,
                Title       = e.Title,
                Description = e.Description,
                CreatedAt   = e.CreatedAt,
            })
            .ToList();
    }

    public async Task<AssignmentDto> UpsertResourcesAsync(
        Guid id,
        UpsertAssignmentResourcesRequest request,
        CancellationToken ct = default)
    {
        var hasSql = request.DatabaseSql.HasValue;
        var hasUrl = !string.IsNullOrWhiteSpace(request.GivenApiBaseUrl);

        if (!hasSql && !hasUrl)
            throw new BadRequestException("Provide at least one of: databaseSql file or givenApiBaseUrl.");

        var entity = await unitOfWork.Assignments.GetByIdAsync(id)
            ?? throw new NotFoundException($"Assignment '{id}' not found.");

        if (hasSql)
        {
            var (fileName, stream) = request.DatabaseSql!.Value;
            EnsureExtension(fileName, ".sql");
            entity.DatabaseSqlPath = await SaveAssignmentFileAsync(id, "database.sql", stream, ct);
        }

        if (hasUrl)
        {
            var url = request.GivenApiBaseUrl!.Trim();
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                throw new BadRequestException("GivenApiBaseUrl must be a valid absolute HTTP/HTTPS URL.");

            entity.GivenApiBaseUrl = url;
        }

        unitOfWork.Assignments.Update(entity);
        await unitOfWork.SaveChangesAsync(ct);

        return Map(entity);
    }

    private async Task<string> SaveAssignmentFileAsync(Guid assignmentId, string targetFileName, Stream content, CancellationToken ct)
    {
        var directory = Path.Combine(_storageBasePath, "assignments", assignmentId.ToString());
        Directory.CreateDirectory(directory);

        var fullPath = Path.Combine(directory, targetFileName);
        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream, ct);

        return fullPath.Replace('\\', '/');
    }

    private static void EnsureExtension(string fileName, string expectedExtension)
    {
        if (!string.Equals(Path.GetExtension(fileName), expectedExtension, StringComparison.OrdinalIgnoreCase))
            throw new BadRequestException($"Invalid file type. Expected '{expectedExtension}'.");
    }

    private static AssignmentDto Map(Assignment entity) => new()
    {
        Id             = entity.Id,
        Title          = entity.Title,
        Description    = entity.Description,
        DatabaseSqlPath = entity.DatabaseSqlPath,
        GivenApiBaseUrl = entity.GivenApiBaseUrl,
        CreatedAt      = entity.CreatedAt,
    };
}
