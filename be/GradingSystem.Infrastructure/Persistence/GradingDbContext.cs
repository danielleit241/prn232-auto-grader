using GradingSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GradingSystem.Infrastructure.Persistence;

public class GradingDbContext(DbContextOptions<GradingDbContext> options) : DbContext(options)
{
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<TestCase> TestCases => Set<TestCase>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<GradingJob> GradingJobs => Set<GradingJob>();
    public DbSet<QuestionResult> QuestionResults => Set<QuestionResult>();
    public DbSet<ReviewNote> ReviewNotes => Set<ReviewNote>();
    public DbSet<ExportJob> ExportJobs => Set<ExportJob>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Assignment
        b.Entity<Assignment>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
        });

        // Question
        b.Entity<Question>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Type).HasConversion<string>();
        });

        // TestCase
        b.Entity<TestCase>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.HttpMethod).HasMaxLength(10).IsRequired();
            e.Property(x => x.UrlTemplate).HasMaxLength(500).IsRequired();
        });

        // Submission
        b.Entity<Submission>(e =>
        {
            e.Property(x => x.StudentCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasConversion<string>();
        });

        // GradingJob
        b.Entity<GradingJob>(e =>
        {
            e.Property(x => x.Status).HasConversion<string>();
        });

        // ExportJob
        b.Entity<ExportJob>(e =>
        {
            e.Property(x => x.Status).HasConversion<string>();
        });

        // ReviewNote: one-to-one with Submission
        b.Entity<ReviewNote>(e =>
        {
            e.HasIndex(x => x.SubmissionId).IsUnique();
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(ct);
    }
}
