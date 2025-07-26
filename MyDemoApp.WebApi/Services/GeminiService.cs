using GeminiDotnet;
using GeminiDotnet.ContentGeneration;
using Microsoft.Extensions.AI;
using MyDemoApp.WebApi.Services;

namespace MyDemoApp.WebApi.Services;

public class GeminiService
{
    private readonly GeminiClient _geminiClient;
    private readonly IAiModelService _aiModelService;
    private string _currentModelId = "gemini-1.5-flash"; // Default fallback

    public GeminiService(IConfiguration configuration, IAiModelService aiModelService)
    {
        var apiKey = configuration["Gemini:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException("Gemini API key is not configured.");
        }
        var options = new GeminiClientOptions
        {
            ApiKey = apiKey
        };
        _geminiClient = new GeminiClient(options);
        _aiModelService = aiModelService;
        
        // Initialize with default model
        InitializeDefaultModelAsync();
    }
    
    private async void InitializeDefaultModelAsync()
    {
        try
        {
            var defaultModel = await _aiModelService.GetDefaultModelAsync();
            if (defaultModel != null)
            {
                _currentModelId = defaultModel.ModelId;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Could not load default model: {ex.Message}");
        }
    }
    
    public void SetCurrentModel(string modelId)
    {
        _currentModelId = modelId;
    }
    
    public string GetCurrentModel()
    {
        return _currentModelId;
    }

    public async Task<string> GenerateTextAsync(string prompt)
    {
        var request = new GenerateContentRequest()
        {
            Contents =
            [
              new Content()
              {
                Parts = [new Part(){ Text = prompt }]
              }
            ]
        };
        var response = string.Empty;
        await foreach (var result in _geminiClient.GenerateContentStreamingAsync(_currentModelId, request))
        {
          foreach (var candidate in result.Candidates)
          {
            foreach (var part in candidate.Content.Parts)
            {
              response += part.Text;
            }
          }
        }

        return response;
    }

    public async IAsyncEnumerable<string> GenerateTextStreamingAsync(string prompt)
    {
        var request = new GenerateContentRequest()
        {
            Contents =
            [
              new Content()
              {
                Parts = [new Part(){ Text = prompt }]
              }
            ]
        };

        await foreach (var result in _geminiClient.GenerateContentStreamingAsync(_currentModelId, request))
        {
            foreach (var candidate in result.Candidates)
            {
                foreach (var part in candidate.Content.Parts)
                {
                    if (!string.IsNullOrEmpty(part.Text))
                    {
                        yield return part.Text;
                    }
                }
            }
        }
    }
}
