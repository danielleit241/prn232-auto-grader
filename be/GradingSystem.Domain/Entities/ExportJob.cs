namespace GradingSystem.Domain.Entities;

public enum ExportStatus { Pending, Done, Failed }

public class ExportJob : BaseEntity
{
    public Guid AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    /// <summary>Optional filter: null = show all rounds (latest per submission)</summary>
    public string? GradingRound { get; set; }
    public ExportStatus Status { get; set; } = ExportStatus.Pending;
    public string? FilePath { get; set; }   // /storage/exports/{file}.xlsx
    public string? ErrorMessage { get; set; }
}
