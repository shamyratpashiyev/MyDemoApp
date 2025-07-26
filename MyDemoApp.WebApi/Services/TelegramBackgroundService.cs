namespace MyDemoApp.WebApi.Services;

public class TelegramBackgroundService : BackgroundService
{
    // private readonly ;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public TelegramBackgroundService(IServiceScopeFactory serviceScopeFactory)
    {
        _serviceScopeFactory = serviceScopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
      ILogger<TelegramBackgroundService> logger = null;

        try
        {
          using (var scope = _serviceScopeFactory.CreateScope())
          {
            logger = scope.ServiceProvider.GetRequiredService<ILogger<TelegramBackgroundService>>();
            var telegramBotService = scope.ServiceProvider.GetRequiredService<ITelegramBotService>();

            logger.LogInformation("Starting Telegram background service");
            await telegramBotService.StartAsync(stoppingToken);

            // Keep the service running
            while (!stoppingToken.IsCancellationRequested)
            {
              await Task.Delay(1000, stoppingToken);
            }
          }
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Telegram background service was cancelled");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error in Telegram background service");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
      using (var scope = _serviceScopeFactory.CreateScope())
      {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<TelegramBackgroundService>>();
        var telegramBotService = scope.ServiceProvider.GetRequiredService<ITelegramBotService>();

        logger.LogInformation("Stopping Telegram background service");
        await telegramBotService.StopAsync(cancellationToken);
        await base.StopAsync(cancellationToken);
      }
    }
}
