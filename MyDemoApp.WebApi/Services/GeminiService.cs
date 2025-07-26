using GeminiDotnet;
using GeminiDotnet.ContentGeneration;
using Microsoft.Extensions.AI;

namespace MyDemoApp.WebApi.Services;

public class GeminiService
{
    private readonly GeminiClient _geminiClient;

    public GeminiService(IConfiguration configuration)
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
        await foreach (var result in _geminiClient.GenerateContentStreamingAsync("gemini-2.0-flash", request))
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

        await foreach (var result in _geminiClient.GenerateContentStreamingAsync("gemini-2.0-flash", request))
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
