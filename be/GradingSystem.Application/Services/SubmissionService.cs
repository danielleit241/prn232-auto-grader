using System.Text.RegularExpressions;
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
        if (!string.Equals(Path.GetExtension(req.File.FileName), ".zip", StringComparison.OrdinalIgnoreCase))
            throw new BadRequestException("Only .zip files are accepted.");

        var entity = new Submission
        {
            AssignmentId    = req.AssignmentId,
            StudentCode     = req.StudentCode.Trim(),
            Status          = SubmissionStatus.Pending,
            ArtifactZipPath = string.Empty,
        };

        var dir = Path.Combine(_basePath, "submissions", entity.Id.ToString());
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, "artifact.zip");

        await using (var fs = File.Create(path))
            await req.File.Content.CopyToAsync(fs, ct);

        entity.ArtifactZipPath = path.Replace('\\', '/');

        await uow.Submissions.AddAsync(entity);
        await uow.SaveChangesAsync(ct);

        return Map(entity);
    }

    public async Task<SubmissionDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await uow.Submissions.GetByIdAsync(id);
        return entity is null ? null : Map(entity);
    }

    public async Task<IEnumerable<QuestionResultDto>> GetResultsAsync(Guid submissionId, CancellationToken ct = default)
    {
        var submission = await uow.Submissions.GetByIdAsync(submissionId)
            ?? throw new NotFoundException($"Submission '{submissionId}' not found.");

        var results = await uow.QuestionResults.FindAsync(r => r.SubmissionId == submissionId);

        return results.Select(r => MapResult(r, submission.StudentCode));
    }

    public async Task<GradingJobDto> TriggerGradeAsync(Guid submissionId, CancellationToken ct = default)
    {
        var submission = await uow.Submissions.GetByIdAsync(submissionId)
            ?? throw new NotFoundException($"Submission '{submissionId}' not found.");

        var job = new GradingJob
        {
            SubmissionId = submissionId,
            Status       = JobStatus.Pending,
        };

        submission.Status = SubmissionStatus.Grading;

        await uow.GradingJobs.AddAsync(job);
        uow.Submissions.Update(submission);
        await uow.SaveChangesAsync(ct);

        return MapJob(job);
    }

    private static SubmissionDto Map(Submission e) => new()
    {
        Id           = e.Id,
        AssignmentId = e.AssignmentId,
        StudentCode  = e.StudentCode,
        Status       = e.Status,
        CreatedAt    = e.CreatedAt,
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
        StudentId     = ParseStudentId(studentCode),
        Score         = r.Score,
        MaxScore      = r.MaxScore,
        FinalScore    = r.FinalScore,
        Detail        = r.Detail,
        AdjustedScore = r.AdjustedScore,
        AdjustReason  = r.AdjustReason,
        AdjustedBy    = r.AdjustedBy,
        AdjustedAt    = r.AdjustedAt,
    };

    private static string ParseStudentId(string code)
    {
        var m = Regex.Match(code, @"[a-zA-Z]{2}\d{6}");
        return m.Success ? m.Value : code;
    }
}
