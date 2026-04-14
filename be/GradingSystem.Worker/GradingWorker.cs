using GradingSystem.Worker.Options;
using Microsoft.Extensions.Options;

namespace GradingSystem.Worker;

public class GradingWorker(
    IOptions<WorkerOptions> opts,
    ILogger<GradingWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        logger.LogInformation("GradingWorker started. Poll interval: {Interval}s",
            opts.Value.PollIntervalSeconds);

        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(opts.Value.PollIntervalSeconds), ct);
        }
    }
}
