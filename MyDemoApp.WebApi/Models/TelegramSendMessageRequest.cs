namespace MyDemoApp.WebApi.Models;

public class TelegramSendMessageRequest
{
    public long ChatId { get; set; }
    public string Message { get; set; } = string.Empty;
}