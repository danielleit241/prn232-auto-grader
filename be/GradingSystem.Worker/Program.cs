using GradingSystem.Infrastructure.Extensions;
using GradingSystem.Worker;
using GradingSystem.Worker.Options;
using GradingSystem.Worker.Services;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.Configure<WorkerOptions>(
    builder.Configuration.GetSection("Worker"));

builder.Services.AddHttpClient();

// Worker runners — singleton-safe (không giữ DbContext)
builder.Services.AddSingleton<ArtifactRunner>();
builder.Services.AddSingleton<TestRunner>();
builder.Services.AddSingleton<ExportRunner>();

builder.Services.AddHostedService<GradingWorker>();

var host = builder.Build();
host.Run();
