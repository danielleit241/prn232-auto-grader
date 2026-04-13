using Q2;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorPages();
builder.Services.AddHttpClient();

//Initialize UrlUtilities with configuration
//DO NOT change this code
Utilities.Initialize(builder.Configuration);
//End

var app = builder.Build();

app.UseRouting();

app.MapGet("/", () => Results.Redirect("/Instructor"));

app.MapRazorPages();

app.Run();
