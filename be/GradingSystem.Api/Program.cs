var builder = WebApplication.CreateBuilder(args);

// ── Database ─────────────────────────────────────────────
// builder.Services.AddDbContext<GradingDbContext>(opt =>
//     opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// ── Repositories ─────────────────────────────────────────
// builder.Services.AddScoped<IAssignmentRepository, AssignmentRepository>();
// builder.Services.AddScoped<ISubmissionRepository, SubmissionRepository>();
// builder.Services.AddScoped<IGradingJobRepository, GradingJobRepository>();
// builder.Services.AddScoped<IQuestionResultRepository, QuestionResultRepository>();

// ── Services ──────────────────────────────────────────────
// builder.Services.AddScoped<IAssignmentService, AssignmentService>();
// builder.Services.AddScoped<ISubmissionService, SubmissionService>();
// builder.Services.AddScoped<IGradingJobService, GradingJobService>();
// builder.Services.AddScoped<IExportService, ExportService>();

// ── HTTP / Swagger / CORS ─────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run();
