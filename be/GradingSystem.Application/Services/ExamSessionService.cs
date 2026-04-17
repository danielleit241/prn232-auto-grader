using System.Text.RegularExpressions;
using GradingSystem.Application.DTOs;
using GradingSystem.Application.Exceptions;
using GradingSystem.Application.Interfaces;
using GradingSystem.Application.Messaging;
using GradingSystem.Domain.Entities;
using MassTransit;

namespace GradingSystem.Application.Services;

public partial class ExamSessionService(IUnitOfWork unitOfWork, IPublishEndpoint publishEndpoint) : IExamSessionService
{
    public async Task<ExamSessionDto> CreateAsync(CreateExamSessionRequest req, CancellationToken ct = default)
    {
        var entity = new ExamSession
        {
            Title       = req.Title.Trim(),
            Description = req.Description?.Trim(),
        };

        await unitOfWork.ExamSessions.AddAsync(entity);
        await unitOfWork.SaveChangesAsync(ct);

        return MapSummary(entity);
    }

    public async Task<ExamSessionDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await unitOfWork.ExamSessions.GetByIdAsync(id);
        if (entity is null) return null;

        var assignments = await unitOfWork.Assignments.FindAsync(a => a.ExamSessionId == id);

        return new ExamSessionDto
        {
            Id          = entity.Id,
            Title       = entity.Title,
            Description = entity.Description,
            CreatedAt   = entity.CreatedAt,
            Assignments = assignments.Select(a => new AssignmentSummaryDto
            {
                Id          = a.Id,
                Code        = a.Code,
                Title       = a.Title,
                Description = a.Description,
                CreatedAt   = a.CreatedAt,
            }).ToList(),
        };
    }

    public async Task<IReadOnlyList<ExamSessionSummaryDto>> GetAllAsync(CancellationToken ct = default)
    {
        var entities = await unitOfWork.ExamSessions.GetAllAsync();
        return entities.OrderByDescending(e => e.CreatedAt)
            .Select(e => new ExamSessionSummaryDto
            {
                Id          = e.Id,
                Title       = e.Title,
                Description = e.Description,
                CreatedAt   = e.CreatedAt,
            }).ToList();
    }

    public async Task<ExamSessionDto> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await unitOfWork.ExamSessions.GetByIdAsync(id)
            ?? throw new NotFoundException($"ExamSession '{id}' not found.");

        var participants = await unitOfWork.Participants.FindAsync(p => p.ExamSessionId == id);
        foreach (var p in participants)
            unitOfWork.Participants.Remove(p);

        var assignments = await unitOfWork.Assignments.FindAsync(a => a.ExamSessionId == id);
        foreach (var a in assignments)
        {
            a.ExamSessionId = null;
            unitOfWork.Assignments.Update(a);
        }

        unitOfWork.ExamSessions.Remove(entity);
        await unitOfWork.SaveChangesAsync(ct);

        return MapSummary(entity);
    }

    public async Task<ImportParticipantsResultDto> ImportParticipantsAsync(
        Guid sessionId,
        Stream csvStream,
        CancellationToken ct = default)
    {
        _ = await unitOfWork.ExamSessions.GetByIdAsync(sessionId)
            ?? throw new NotFoundException($"ExamSession '{sessionId}' not found.");

        using var reader = new StreamReader(csvStream);
        var result = new ImportParticipantsResultDto();

        string? line;
        int lineNumber = 0;
        while ((line = await reader.ReadLineAsync(ct)) != null)
        {
            lineNumber++;
            if (string.IsNullOrWhiteSpace(line)) continue;

            // Skip header row
            if (lineNumber == 1 && line.TrimStart().StartsWith("username", StringComparison.OrdinalIgnoreCase))
                continue;

            var parts = line.Split(',');
            if (parts.Length < 3)
            {
                result.Errors.Add($"Line {lineNumber}: expected 'username,studentCode,assignmentCode'.");
                continue;
            }

            var username        = parts[0].Trim().ToLowerInvariant();
            var studentCode     = parts[1].Trim();
            var assignmentCode  = parts[2].Trim().ToUpperInvariant();

            var matched = await unitOfWork.Assignments.FindAsync(a => a.Code == assignmentCode);
            var assignment = matched.FirstOrDefault();
            if (assignment is null)
            {
                result.Errors.Add($"Line {lineNumber}: assignment code '{assignmentCode}' not found.");
                continue;
            }

            // Check for duplicate
            var existing = await unitOfWork.Participants.FindAsync(
                p => p.ExamSessionId == sessionId && p.Username == username);

            if (existing.Any())
            {
                result.Skipped++;
                continue;
            }

            await unitOfWork.Participants.AddAsync(new Participant
            {
                ExamSessionId = sessionId,
                Username      = username,
                StudentCode   = studentCode,
                AssignmentId  = assignment.Id,
            });
            result.Created++;
        }

        if (result.Created > 0)
            await unitOfWork.SaveChangesAsync(ct);

        return result;
    }

    public async Task<IReadOnlyList<ParticipantDto>> GetParticipantsAsync(Guid sessionId, CancellationToken ct = default)
    {
        _ = await unitOfWork.ExamSessions.GetByIdAsync(sessionId)
            ?? throw new NotFoundException($"ExamSession '{sessionId}' not found.");

        var participants = await unitOfWork.Participants.FindAsync(p => p.ExamSessionId == sessionId);
        var assignmentIds = participants.Select(p => p.AssignmentId).Distinct().ToList();
        var assignmentTitles = new Dictionary<Guid, string>();
        var assignmentCodes  = new Dictionary<Guid, string>();
        foreach (var aId in assignmentIds)
        {
            var a = await unitOfWork.Assignments.GetByIdAsync(aId);
            if (a is not null)
            {
                assignmentTitles[aId] = a.Title;
                assignmentCodes[aId]  = a.Code;
            }
        }

        return participants.Select(p => new ParticipantDto
        {
            Id              = p.Id,
            ExamSessionId   = p.ExamSessionId,
            Username        = p.Username,
            StudentCode     = p.StudentCode,
            AssignmentId    = p.AssignmentId,
            AssignmentCode  = assignmentCodes.GetValueOrDefault(p.AssignmentId, ""),
            AssignmentTitle = assignmentTitles.GetValueOrDefault(p.AssignmentId, ""),
            CreatedAt       = p.CreatedAt,
        }).ToList();
    }

    public async Task<int> TriggerSessionGradeAsync(Guid sessionId, string gradingRound, CancellationToken ct = default)
    {
        _ = await unitOfWork.ExamSessions.GetByIdAsync(sessionId)
            ?? throw new NotFoundException($"ExamSession '{sessionId}' not found.");

        // Find all assignments in this session
        var assignments = await unitOfWork.Assignments.FindAsync(a => a.ExamSessionId == sessionId);
        var assignmentIds = assignments.Select(a => a.Id).ToHashSet();

        // Find pending submissions in this session + round
        var submissions = (await unitOfWork.Submissions.FindAsync(
            s => assignmentIds.Contains(s.AssignmentId)
                 && s.GradingRound == gradingRound
                 && s.HasArtifact
                 && s.Status == SubmissionStatus.Pending))
            .ToList();

        int enqueued = 0;

        foreach (var submission in submissions)
        {
            var job = new GradingJob
            {
                SubmissionId = submission.Id,
                GradingRound = submission.GradingRound,
                Status       = JobStatus.Pending,
            };

            submission.Status = SubmissionStatus.Grading;
            unitOfWork.Submissions.Update(submission);
            await unitOfWork.GradingJobs.AddAsync(job);
            await unitOfWork.SaveChangesAsync(ct);

            await publishEndpoint.Publish(new GradeJobMessage(job.Id), ct);
            enqueued++;
        }

        return enqueued;
    }

    private static ExamSessionDto MapSummary(ExamSession e) => new()
    {
        Id          = e.Id,
        Title       = e.Title,
        Description = e.Description,
        CreatedAt   = e.CreatedAt,
    };

    [GeneratedRegex(@"[a-z]{2,3}\d{6}$", RegexOptions.IgnoreCase)]
    public static partial Regex StudentCodeSuffixRegex();

    /// <summary>Parses "hoalvpse181951" → studentCode="pse181951", username=fullName.</summary>
    public static (string username, string studentCode) ParseFolderName(string folderName)
    {
        var lower = folderName.ToLowerInvariant();
        var m = StudentCodeSuffixRegex().Match(lower);
        return m.Success
            ? (lower, m.Value)
            : (lower, lower);
    }
}
