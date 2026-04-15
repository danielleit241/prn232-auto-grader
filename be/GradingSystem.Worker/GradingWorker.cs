using System.Collections.Concurrent;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;
using GradingSystem.Worker.Options;
using GradingSystem.Worker.Services;
using Microsoft.Extensions.Options;

namespace GradingSystem.Worker;

public class GradingWorker(
    IServiceScopeFactory scopeFactory,
    ArtifactRunner artifactRunner,
    TestRunner testRunner,
    ExportRunner exportRunner,
    IOptions<WorkerOptions> opts,
    ILogger<GradingWorker> logger) : BackgroundService
{
    private readonly ConcurrentDictionary<Guid, SemaphoreSlim> _locks = new();

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        logger.LogInformation("GradingWorker started. Poll interval: {Interval}s",
            opts.Value.PollIntervalSeconds);

        while (!ct.IsCancellationRequested)
        {
            await ProcessNextGradingJobAsync(ct);
            await ProcessNextExportJobAsync(ct);
            await Task.Delay(TimeSpan.FromSeconds(opts.Value.PollIntervalSeconds), ct);
        }
    }

    private async Task ProcessNextGradingJobAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var job = (await uow.GradingJobs.FindAsync(j => j.Status == JobStatus.Pending))
                  .OrderBy(j => j.CreatedAt)
                  .FirstOrDefault();

        if (job == null) return;

        var submission = await uow.Submissions.GetByIdAsync(job.SubmissionId);
        if (submission == null)
        {
            logger.LogError("Submission {Id} not found for job {JobId}", job.SubmissionId, job.Id);
            return;
        }

        var assignment = await uow.Assignments.GetByIdAsync(submission.AssignmentId);
        if (assignment == null)
        {
            logger.LogError("Assignment {Id} not found for submission {SubId}", submission.AssignmentId, submission.Id);
            return;
        }

        submission.Assignment = assignment;
        job.Submission = submission;

        var questions = (await uow.Questions.FindAsync(q => q.AssignmentId == assignment.Id))
                        .OrderBy(q => q.CreatedAt)
                        .ToList();

        var semaphore = _locks.GetOrAdd(assignment.Id, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync(ct);

        StudentContext? ctx = null;
        try
        {
            job.Status = JobStatus.Running;
            job.StartedAt = DateTime.UtcNow;
            uow.GradingJobs.Update(job);
            await uow.SaveChangesAsync(ct);

            logger.LogInformation("Processing job {JobId} for submission {SubId}", job.Id, submission.Id);

            ctx = await artifactRunner.RunAsync(job, questions, ct);
            await testRunner.RunAsync(job, ctx, uow, ct);

            job.Status = JobStatus.Done;
            submission.Status = SubmissionStatus.Done;

            logger.LogInformation("Job {JobId} completed successfully", job.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Job {JobId} failed", job.Id);
            job.Status = JobStatus.Failed;
            job.ErrorMessage = ex.Message;
            submission.Status = SubmissionStatus.Error;
        }
        finally
        {
            if (ctx != null)
            {
                try { await artifactRunner.CleanupAsync(ctx); }
                catch (Exception ex) { logger.LogWarning(ex, "Cleanup failed for job {JobId}", job.Id); }
            }

            job.FinishedAt = DateTime.UtcNow;
            uow.GradingJobs.Update(job);
            uow.Submissions.Update(submission);
            await uow.SaveChangesAsync(ct);

            semaphore.Release();
        }
    }

    private async Task ProcessNextExportJobAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var exportJob = (await uow.ExportJobs.FindAsync(j => j.Status == ExportStatus.Pending))
                        .OrderBy(j => j.CreatedAt)
                        .FirstOrDefault();

        if (exportJob == null) return;

        logger.LogInformation("Processing export job {JobId} for assignment {AssignmentId}",
            exportJob.Id, exportJob.AssignmentId);

        try
        {
            var path = await exportRunner.GenerateAsync(exportJob, uow, ct);
            exportJob.Status = ExportStatus.Done;
            exportJob.FilePath = path;

            logger.LogInformation("Export job {JobId} completed: {Path}", exportJob.Id, path);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Export job {JobId} failed", exportJob.Id);
            exportJob.Status = ExportStatus.Failed;
            exportJob.ErrorMessage = ex.Message;
        }

        uow.ExportJobs.Update(exportJob);
        await uow.SaveChangesAsync(ct);
    }
}
