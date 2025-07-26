using Microsoft.Extensions.Options;
using MyDemoApp.WebApi.Models;

namespace MyDemoApp.WebApi.Services;

public class StartupValidationService : IHostedService
{
    private readonly ILogger<StartupValidationService> _logger;
    private readonly TelegramConfiguration _telegramConfig;
    private readonly IConfiguration _configuration;

    public StartupValidationService(
        ILogger<StartupValidationService> logger,
        IOptions<TelegramConfiguration> telegramConfig,
        IConfiguration configuration)
    {
        _logger = logger;
        _telegramConfig = telegramConfig.Value;
        _configuration = configuration;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("=== Startup Validation ===");
        
        // Validate Gemini configuration
        var geminiApiKey = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrEmpty(geminiApiKey))
        {
            _logger.LogWarning("⚠️  Gemini API key is not configured");
        }
        else
        {
            _logger.LogInformation("✅ Gemini API key is configured");
        }

        // Validate Telegram configuration
        if (string.IsNullOrEmpty(_telegramConfig.BotToken) || _telegramConfig.BotToken == "YOUR_BOT_TOKEN_HERE")
        {
            _logger.LogWarning("⚠️  Telegram bot token is not configured. Please update appsettings.json with your bot token.");
            _logger.LogInformation("📝 To get a bot token:");
            _logger.LogInformation("   1. Message @BotFather on Telegram");
            _logger.LogInformation("   2. Send /newbot command");
            _logger.LogInformation("   3. Follow instructions to create your bot");
            _logger.LogInformation("   4. Copy the token to appsettings.json");
        }
        else
        {
            _logger.LogInformation("✅ Telegram bot token is configured");
            
            if (_telegramConfig.AllowedUsers.Any())
            {
                _logger.LogInformation($"🔒 Bot access restricted to {_telegramConfig.AllowedUsers.Count} users");
            }
            else
            {
                _logger.LogInformation("🌐 Bot access is open to all users");
            }
        }

        _logger.LogInformation("=== End Validation ===");
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}