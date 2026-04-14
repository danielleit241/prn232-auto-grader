using GradingSystem.Infrastructure.Extensions;
using GradingSystem.Worker;
using GradingSystem.Worker.Options;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.Configure<WorkerOptions>(
    builder.Configuration.GetSection("Worker"));

builder.Services.AddHttpClient();

builder.Services.AddHostedService<GradingWorker>();

var host = builder.Build();
host.Run();
