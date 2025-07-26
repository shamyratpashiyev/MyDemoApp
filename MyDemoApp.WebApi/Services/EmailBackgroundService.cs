using MyDemoApp.WebApi.Models;
using Microsoft.Extensions.Options;

namespace MyDemoApp.WebApi.Services;

public class EmailBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly EmailConfiguration _emailConfig;
    private readonly ILogger<EmailBackgroundService> _logger;

    public EmailBackgroundService(
        IServiceProvider serviceProvider,
        IOptions<EmailConfiguration> emailConfig,
        ILogger<EmailBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _emailConfig = emailConfig.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email Background Service started.");

        // Check if email credentials are configured
        if (string.IsNullOrEmpty(_emailConfig.Gmail.Username) || string.IsNullOrEmpty(_emailConfig.Gmail.Password))
        {
            _logger.LogWarning("Email credentials not configured. Email service will not start.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var emailProcessingService = scope.ServiceProvider.GetRequiredService<IEmailProcessingService>();
                
                await emailProcessingService.ProcessEmailsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in email background service");
            }

            // Wait for the configured interval before checking again
            var delay = TimeSpan.FromMinutes(_emailConfig.CheckIntervalMinutes);
            _logger.LogDebug($"Waiting {delay.TotalMinutes} minutes before next email check...");
            
            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
        }

        _logger.LogInformation("Email Background Service stopped.");
    }
}