namespace GradingSystem.Worker.Options;

public class WorkerOptions
{
    public int PollIntervalSeconds { get; set; } = 5;
    public int MaxConcurrentJobs { get; set; } = 3;
    public int ArtifactHealthCheckTimeoutSeconds { get; set; } = 15;
    public int ArtifactPortRangeStart { get; set; } = 7000;
    public int ArtifactPortRangeEnd { get; set; } = 7999;
}
