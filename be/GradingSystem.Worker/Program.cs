using GradingSystem.Infrastructure.Extensions;
using GradingSystem.Worker.Options;
using GradingSystem.Worker.Services;
using GradingSystem.Worker.Workers;

var builder = Host.CreateApplicationBuilder(args);

if (string.IsNullOrWhiteSpace(builder.Configuration["Storage:BasePath"]))
{
    var solutionRoot = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, ".."));
    builder.Configuration["Storage:BasePath"] = Path.Combine(solutionRoot, "storage");
}

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.Configure<WorkerOptions>(
    builder.Configuration.GetSection("Worker"));

builder.Services.Configure<StorageCleanupOptions>(
    builder.Configuration.GetSection("StorageCleanup"));

builder.Services.AddHttpClient();

builder.Services.AddSingleton<ArtifactRunner>();
builder.Services.AddSingleton<TestRunner>();
builder.Services.AddSingleton<ExportRunner>();

builder.Services.AddHostedService<GradingWorker>();
builder.Services.AddHostedService<StorageCleanupWorker>();

var host = builder.Build();
host.Run();
