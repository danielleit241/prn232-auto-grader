using System.Text.RegularExpressions;
using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace GradingSystem.Infrastructure.Services;

public class SubmissionService(IUnitOfWork unitOfWork, IConfiguration configuration) : ISubmissionService
{
    private static readonly Regex StudentIdRegex = new(@"[a-zA-Z]{2}\d{6}", RegexOptions.Compiled);
    private readonly string _storageBasePath = configuration["Storage:BasePath"] ?? "/storage";

    public async Task<SubmissionDto> UploadAsync(UploadSubmissionRequest req, CancellationToken ct = default)
    {
        if (req.AssignmentId == Guid.Empty)
        {
            throw new BadRequestException("AssignmentId is required.");
        }

        if (string.IsNullOrWhiteSpace(req.StudentCode))
        {
            throw new BadRequestException("StudentCode is required.");
        }

        if (req.File is null)
        {
            throw new BadRequestException("Zip file is required.");
        }

        if (!string.Equals(Path.GetExtension(req.File.Value.FileName), ".zip", StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("Invalid file type. Expected '.zip'.");
        }

        _ = await unitOfWork.Assignments.GetByIdAsync(req.AssignmentId)
            ?? throw new NotFoundException($"Assignment '{req.AssignmentId}' not found.");

        var entity = new Submission
        {
            AssignmentId = req.AssignmentId,
            StudentCode = req.StudentCode.Trim(),
            Status = SubmissionStatus.Pending
        };

        var directory = Path.Combine(_storageBasePath, "submissions", entity.Id.ToString());
        Directory.CreateDirectory(directory);
        var fullPath = Path.Combine(directory, "artifact.zip");

        await using (var fileStream = File.Create(fullPath))
        {
            await req.File.Value.Content.CopyToAsync(fileStream, ct);
        }

        entity.ArtifactZipPath = NormalizePath(fullPath);

        await unitOfWork.Submissions.AddAsync(entity);
        await unitOfWork.SaveChangesAsync(ct);

        return MapSubmission(entity);
    }

    public async Task<SubmissionDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await unitOfWork.Submissions.GetByIdAsync(id);
        return entity is null ? null : MapSubmission(entity);
    }

    public async Task<IEnumerable<QuestionResultDto>> GetResultsAsync(Guid submissionId, CancellationToken ct = default)
    {
        var submission = await unitOfWork.Submissions.GetByIdAsync(submissionId)
            ?? throw new NotFoundException($"Submission '{submissionId}' not found.");

        var studentId = ParseStudentId(submission.StudentCode);
        var results = await unitOfWork.QuestionResults.FindAsync(x => x.SubmissionId == submissionId);

        return results
            .OrderBy(x => x.CreatedAt)
            .Select(x => MapQuestionResult(x, submission.StudentCode, studentId))
            .ToList();
    }

    public async Task<GradingJobDto> TriggerGradeAsync(Guid submissionId, CancellationToken ct = default)
    {
        var submission = await unitOfWork.Submissions.GetByIdAsync(submissionId)
            ?? throw new NotFoundException($"Submission '{submissionId}' not found.");

        if (submission.Status == SubmissionStatus.Grading)
        {
            throw new ConflictException($"Submission '{submissionId}' is being graded.");
        }

        var gradingJob = new GradingJob
        {
            SubmissionId = submissionId,
            Status = JobStatus.Pending
        };

        submission.Status = SubmissionStatus.Grading;
        unitOfWork.Submissions.Update(submission);
        await unitOfWork.GradingJobs.AddAsync(gradingJob);
        await unitOfWork.SaveChangesAsync(ct);

        return MapGradingJob(gradingJob);
    }

    private static string ParseStudentId(string code)
    {
        var match = StudentIdRegex.Match(code);
        return match.Success ? match.Value : code;
    }

    private static string NormalizePath(string path) => path.Replace('\\', '/');

    private static SubmissionDto MapSubmission(Submission entity) => new()
    {
        Id = entity.Id,
        AssignmentId = entity.AssignmentId,
        StudentCode = entity.StudentCode,
        ArtifactZipPath = entity.ArtifactZipPath,
        Status = entity.Status,
        CreatedAt = entity.CreatedAt
    };

    private static GradingJobDto MapGradingJob(GradingJob entity) => new()
    {
        Id = entity.Id,
        SubmissionId = entity.SubmissionId,
        Status = entity.Status,
        ErrorMessage = entity.ErrorMessage,
        StartedAt = entity.StartedAt,
        FinishedAt = entity.FinishedAt
    };

    private static QuestionResultDto MapQuestionResult(QuestionResult entity, string studentCode, string studentId) => new()
    {
        Id = entity.Id,
        SubmissionId = entity.SubmissionId,
        QuestionId = entity.QuestionId,
        StudentCode = studentCode,
        StudentId = studentId,
        Score = entity.Score,
        MaxScore = entity.MaxScore,
        FinalScore = entity.FinalScore,
        Detail = entity.Detail,
        AdjustedScore = entity.AdjustedScore,
        AdjustReason = entity.AdjustReason,
        AdjustedBy = entity.AdjustedBy,
        AdjustedAt = entity.AdjustedAt
    };
}
