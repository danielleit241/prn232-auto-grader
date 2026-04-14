var builder = Host.CreateApplicationBuilder(args);

// ── Database ─────────────────────────────────────────────
// builder.Services.AddDbContext<GradingDbContext>(opt =>
//     opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// ── Services ──────────────────────────────────────────────
// builder.Services.AddScoped<IArtifactRunner, ArtifactRunner>();
// builder.Services.AddScoped<ITestRunner, TestRunner>();
// builder.Services.AddScoped<ISqlServerResetService, SqlServerResetService>();

// ── Hosted Workers ────────────────────────────────────────
// builder.Services.AddHostedService<GradingWorker>();

var host = builder.Build();
host.Run();
