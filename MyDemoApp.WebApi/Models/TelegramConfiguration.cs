namespace MyDemoApp.WebApi.Models;

public class TelegramConfiguration
{
    public string BotToken { get; set; } = string.Empty;
    public string WebhookUrl { get; set; } = string.Empty;
    public List<long> AllowedUsers { get; set; } = new();
}