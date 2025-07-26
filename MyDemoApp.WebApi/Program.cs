using Microsoft.EntityFrameworkCore;
using MyDemoApp.WebApi.Data;
using MyDemoApp.WebApi.Services;
using MyDemoApp.WebApi.Hubs;
using MyDemoApp.WebApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<GeminiService>();
builder.Services.AddScoped<AiStreamingService>();

// Add SignalR
builder.Services.AddSignalR();

// Configure JSON options for API endpoints
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200", "http://localhost:5134") // Angular dev server and local testing
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials(); // Required for SignalR
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
  app.MapOpenApi();
  app.UseSwagger();
  app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseStaticFiles(); // Enable serving static files from wwwroot

// Map SignalR hub
app.MapHub<AiStreamingHub>("/aiStreamingHub");

// Keep the original endpoint for backward compatibility
app.MapPost("/gemini", async (GeminiService geminiService, string prompt) =>
{
    var result = await geminiService.GenerateTextAsync(prompt);
    return Results.Ok(result);
});

// Test endpoint to verify JSON parsing
app.MapPost("/gemini/stream/test", (StreamingRequest request) =>
{
    Console.WriteLine($"Test endpoint - Prompt: '{request?.Prompt}', ConnectionId: '{request?.ConnectionId}'");
    return Results.Ok(new { received = request, message = "Test successful" });
});

// New endpoint for streaming AI responses
app.MapPost("/gemini/stream", async (AiStreamingService streamingService, StreamingRequest request) =>
{
    Console.WriteLine($"Received streaming request - Prompt: '{request?.Prompt}', ConnectionId: '{request?.ConnectionId}'");
    
    if (request == null)
    {
        Console.WriteLine("Request is null");
        return Results.BadRequest(new { error = "Request body is required" });
    }
    
    if (string.IsNullOrEmpty(request.Prompt) || string.IsNullOrEmpty(request.ConnectionId))
    {
        Console.WriteLine($"Missing required fields - Prompt empty: {string.IsNullOrEmpty(request.Prompt)}, ConnectionId empty: {string.IsNullOrEmpty(request.ConnectionId)}");
        return Results.BadRequest(new { error = "Prompt and ConnectionId are required" });
    }

    Console.WriteLine("Starting streaming...");
    // Start streaming in the background
    _ = Task.Run(async () => await streamingService.StreamAiResponseAsync(request.Prompt, request.ConnectionId));
    
    return Results.Ok(new { message = "Streaming started", connectionId = request.ConnectionId });
});

app.Run();
