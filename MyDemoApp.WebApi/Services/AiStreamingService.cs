using Microsoft.AspNetCore.SignalR;
using MyDemoApp.WebApi.Hubs;

namespace MyDemoApp.WebApi.Services;

public class AiStreamingService
{
    private readonly GeminiService _geminiService;
    private readonly IHubContext<AiStreamingHub> _hubContext;

    public AiStreamingService(GeminiService geminiService, IHubContext<AiStreamingHub> hubContext)
    {
        _geminiService = geminiService;
        _hubContext = hubContext;
    }

    public async Task StreamAiResponseAsync(string prompt, string connectionId)
    {
        try
        {
            // Notify that streaming has started
            await _hubContext.Clients.Client(connectionId).SendAsync("StreamStarted", new { prompt });

            // Stream the AI response
            await foreach (var chunk in _geminiService.GenerateTextStreamingAsync(prompt))
            {
                if (!string.IsNullOrEmpty(chunk))
                {
                    await _hubContext.Clients.Client(connectionId).SendAsync("StreamChunk", new { chunk });
                }
            }

            // Notify that streaming has completed
            await _hubContext.Clients.Client(connectionId).SendAsync("StreamCompleted");
        }
        catch (Exception ex)
        {
            // Notify about the error
            await _hubContext.Clients.Client(connectionId).SendAsync("StreamError", new { error = ex.Message });
        }
    }
}