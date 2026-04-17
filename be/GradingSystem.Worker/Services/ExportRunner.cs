using System.Text.Json;
using GradingSystem.Application.Common;
using GradingSystem.Application.Interfaces;
using GradingSystem.Domain.Entities;
using OfficeOpenXml;

namespace GradingSystem.Worker.Services;

public class ExportRunner(
    IConfiguration config,
    ILogger<ExportRunner> logger)
{
    public async Task<string> GenerateAsync(ExportJob job, IUnitOfWork uow, CancellationToken ct)
    {
        var assignment = await uow.Assignments.GetByIdAsync(job.AssignmentId)
                         ?? throw new InvalidOperationException($"Assignment {job.AssignmentId} not found");

        var questions = (await uow.Questions.FindAsync(q => q.AssignmentId == job.AssignmentId))
                        .OrderBy(q => q.CreatedAt).ToList();

        var testCaseMap = new Dictionary<Guid, List<TestCase>>();
        foreach (var q in questions)
            testCaseMap[q.Id] = (await uow.TestCases.FindAsync(tc => tc.QuestionId == q.Id))
                                 .OrderBy(tc => tc.CreatedAt).ToList();

        var submissionsQuery = await uow.Submissions.FindAsync(s => s.AssignmentId == job.AssignmentId);
        var submissions = (job.GradingRound != null
            ? submissionsQuery.Where(s => s.GradingRound == job.GradingRound)
            : submissionsQuery).ToList();

        var submissionIds = submissions.Select(s => s.Id).ToHashSet();

        // Resolve latest Done GradingJob per submission, then load its results
        var allGradingJobs = (await uow.GradingJobs.FindAsync(
            j => submissionIds.Contains(j.SubmissionId) && j.Status == JobStatus.Done)).ToList();

        // Latest Done job per submission
        var latestJobBySubmission = allGradingJobs
            .GroupBy(j => j.SubmissionId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(j => j.FinishedAt).First().Id);

        var latestJobIds = latestJobBySubmission.Values.ToHashSet();

        // Results keyed to a specific job (includes missing-submission 0-score rows with null GradingJobId)
        var allResults = (await uow.QuestionResults.FindAsync(r =>
            submissionIds.Contains(r.SubmissionId)
            && (r.GradingJobId == null || latestJobIds.Contains(r.GradingJobId.Value)))).ToList();

        var allNotes    = (await uow.ReviewNotes.FindAsync(n =>
                              submissionIds.Contains(n.SubmissionId))).ToList();

        var columns = new List<string> { "Tên", "MSSV" };
        for (int qi = 0; qi < questions.Count; qi++)
        {
            foreach (var tc in testCaseMap[questions[qi].Id])
                columns.Add($"Q{qi + 1}: {tc.Name}");
            columns.Add($"Q{qi + 1} Total");
            columns.Add($"Q{qi + 1} Adj");
        }
        columns.Add("Grand Total");
        columns.Add("Notes");

        var rows = new List<List<object>>();
        foreach (var sub in submissions.OrderBy(s => StudentCode.ParseId(s.StudentCode)))
        {
            var row = new List<object>
            {
                sub.StudentCode.Length > 9 ? sub.StudentCode[..^9] : sub.StudentCode,
                StudentCode.ParseId(sub.StudentCode),
            };

            int grandTotal = 0, grandMax = 0;
            // Use latest-job results if available, fall back to job-less 0-score rows
            latestJobBySubmission.TryGetValue(sub.Id, out var latestJobId);
            var subResults = allResults
                .Where(r => r.SubmissionId == sub.Id
                    && (latestJobId == Guid.Empty ? r.GradingJobId == null : r.GradingJobId == latestJobId))
                .ToList();

            for (int qi = 0; qi < questions.Count; qi++)
            {
                var q       = questions[qi];
                var tcs     = testCaseMap[q.Id];
                var qResult = subResults.FirstOrDefault(r => r.QuestionId == q.Id);

                if (qResult == null)
                {
                    foreach (var _ in tcs) row.Add(0);
                    row.Add($"0/{q.MaxScore}");
                    row.Add(string.Empty);
                    grandMax += q.MaxScore;
                    continue;
                }

                var details = JsonSerializer.Deserialize<List<TestCaseResult>>(qResult.Detail ?? "[]") ?? [];
                for (int ti = 0; ti < tcs.Count; ti++)
                    row.Add(details.ElementAtOrDefault(ti)?.AwardedScore ?? 0);

                row.Add($"{qResult.FinalScore}/{qResult.MaxScore}");
                row.Add(qResult.AdjustReason ?? string.Empty);
                grandTotal += qResult.FinalScore;
                grandMax   += qResult.MaxScore;
            }

            row.Add($"{grandTotal}/{grandMax}");
            row.Add(allNotes.FirstOrDefault(n => n.SubmissionId == sub.Id)?.Content ?? string.Empty);
            rows.Add(row);
        }

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        using var pkg = new ExcelPackage();
        var ws = pkg.Workbook.Worksheets.Add("Results");

        for (int c = 0; c < columns.Count; c++)
            ws.Cells[1, c + 1].Value = columns[c];

        for (int r = 0; r < rows.Count; r++)
            for (int c = 0; c < rows[r].Count; c++)
                ws.Cells[r + 2, c + 1].Value = rows[r][c];

        ws.Cells.AutoFitColumns();

        var dir  = Path.Combine(config["Storage:BasePath"]!, "exports");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, $"{job.Id}.xlsx");
        await pkg.SaveAsAsync(new FileInfo(path), ct);

        logger.LogInformation("Export {JobId} saved to {Path}", job.Id, path);
        return path;
    }
}
