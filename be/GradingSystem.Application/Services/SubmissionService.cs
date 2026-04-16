using GradingSystem.Application.Common;
using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace GradingSystem.Application.Services;

public class SubmissionService(IUnitOfWork uow, IConfiguration config) : ISubmissionService
{
    private readonly string _basePath = config["Storage:BasePath"] ?? "/storage";

    public async Task<SubmissionDto> UploadAsync(UploadSubmissionRequest req, CancellationToken ct = default)
    {
        if (req.File is null)
            throw new BadRequestException("Zip file is required.");

        if (!string.Equals(Path.GetExtension(req.File.Value.FileName), ".zip", StringComparison.OrdinalIgnoreCase))
            throw new BadRequestException("Only .zip files are accepted.");

        _ = await uow.Assignments.GetByIdAsync(req.AssignmentId)
            ?? throw new NotFoundException($"Assignment '{req.AssignmentId}' not found.");

        var entity = new Submission
        {
            AssignmentId    = req.AssignmentId,
            StudentCode     = req.StudentCode.Trim(),
            Status          = SubmissionStatus.Pending,
            ArtifactZipPath = string.Empty,
        };

        var dir  = Path.Combine(_basePath, "submissions", entity.Id.ToString());
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, "artifact.zip");

        await using (var fs = File.Create(path))
            await req.File.Value.Content.CopyToAsync(fs, ct);

        entity.ArtifactZipPath = path.Replace('\\', '/');

        await uow.Submissions.AddAsync(entity);
        await uow.SaveChangesAsync(ct);

        return Map(entity);
    }

    public async Task<SubmissionDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await uow.Submissions.GetByIdAsync(id);
        if (entity is null) return null;

        var results = await uow.QuestionResults.FindAsync(r => r.SubmissionId == id);
        return MapWithScore(entity, results.ToList());
    }

    public async Task<IReadOnlyList<SubmissionDto>> GetByAssignmentIdAsync(
        Guid assignmentId, string? studentCode, CancellationToken ct = default)
    {
        _ = await uow.Assignments.GetByIdAsync(assignmentId)
            ?? throw new NotFoundException($"Assignment '{assignmentId}' not found.");

        var submissions = await uow.Submissions.FindAsync(s => s.AssignmentId == assignmentId);

        if (!string.IsNullOrWhiteSpace(studentCode))
            submissions = submissions.Where(s =>
                s.StudentCode.Contains(studentCode, StringComparison.OrdinalIgnoreCase));

        var list = submissions.OrderBy(s => s.CreatedAt).ToList();

        // Batch-load all results for these submissions
        var ids = list.Select(s => s.Id).ToHashSet();
        var allResults = await uow.QuestionResults.FindAsync(r => ids.Contains(r.SubmissionId));
        var resultsBySubmission = allResults.GroupBy(r => r.SubmissionId)
                                            .ToDictionary(g => g.Key, g => g.ToList());

        return list.Select(s =>
        {
            resultsBySubmission.TryGetValue(s.Id, out var res);
            return MapWithScore(s, res);
        }).ToList();
    }

    public async Task<IEnumerable<QuestionResultDto>> GetResultsAsync(Guid submissionId, CancellationToken ct = default)
    {
        var submission = await uow.Submissions.GetByIdAsync(submissionId)
            ?? throw new NotFoundException($"Submission '{submissionId}' not found.");

        var results = await uow.QuestionResults.FindAsync(r => r.SubmissionId == submissionId);

        return results
            .OrderBy(r => r.CreatedAt)
            .Select(r => MapResult(r, submission.StudentCode));
    }

    public async Task<GradingJobDto> TriggerGradeAsync(Guid submissionId, CancellationToken ct = default)
    {
        var submission = await uow.Submissions.GetByIdAsync(submissionId)
            ?? throw new NotFoundException($"Submission '{submissionId}' not found.");

        if (submission.Status == SubmissionStatus.Grading)
            throw new ConflictException($"Submission '{submissionId}' is already being graded.");

        if (submission.Status == SubmissionStatus.Done)
            throw new ConflictException($"Submission '{submissionId}' has already been graded. Use /adjust to override individual scores.");

        var job = new GradingJob
        {
            SubmissionId = submissionId,
            Status       = JobStatus.Pending,
        };

        submission.Status = SubmissionStatus.Grading;
        uow.Submissions.Update(submission);
        await uow.GradingJobs.AddAsync(job);
        await uow.SaveChangesAsync(ct);

        return MapJob(job);
    }

    public async Task<SubmissionDto> DeleteAsync(Guid submissionId, CancellationToken ct = default)
    {
        var submission = await uow.Submissions.GetByIdAsync(submissionId)
            ?? throw new NotFoundException($"Submission '{submissionId}' not found.");

        FileHelper.SafeDelete(submission.ArtifactZipPath);

        // Delete related grading jobs
        var jobs = await uow.GradingJobs.FindAsync(j => j.SubmissionId == submissionId);
        foreach (var job in jobs)
            uow.GradingJobs.Remove(job);

        // Delete related question results
        var results = await uow.QuestionResults.FindAsync(r => r.SubmissionId == submissionId);
        foreach (var result in results)
            uow.QuestionResults.Remove(result);

        // Delete the submission
        uow.Submissions.Remove(submission);
        await uow.SaveChangesAsync(ct);

        return Map(submission);
    }

    private static SubmissionDto Map(Submission e) => MapWithScore(e, null);

    private static SubmissionDto MapWithScore(Submission e, IList<QuestionResult>? results) => new()
    {
        Id              = e.Id,
        AssignmentId    = e.AssignmentId,
        StudentCode     = e.StudentCode,
        ArtifactZipPath = e.ArtifactZipPath,
        Status          = e.Status,
        CreatedAt       = e.CreatedAt,
        TotalScore      = results is { Count: > 0 } ? results.Sum(r => r.FinalScore) : null,
        MaxScore        = results is { Count: > 0 } ? results.Sum(r => r.MaxScore)   : null,
    };

    private static GradingJobDto MapJob(GradingJob e) => new()
    {
        Id           = e.Id,
        SubmissionId = e.SubmissionId,
        Status       = e.Status,
        ErrorMessage = e.ErrorMessage,
        StartedAt    = e.StartedAt,
        FinishedAt   = e.FinishedAt,
    };

    private static QuestionResultDto MapResult(QuestionResult r, string studentCode) => new()
    {
        Id            = r.Id,
        SubmissionId  = r.SubmissionId,
        QuestionId    = r.QuestionId,
        StudentCode   = studentCode,
        StudentId     = StudentCode.ParseId(studentCode),
        Score         = r.Score,
        MaxScore      = r.MaxScore,
        FinalScore    = r.FinalScore,
        Detail        = r.Detail,
        AdjustedScore = r.AdjustedScore,
        AdjustReason  = r.AdjustReason,
        AdjustedBy    = r.AdjustedBy,
        AdjustedAt    = r.AdjustedAt,
    };

}
