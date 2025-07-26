using Microsoft.Extensions.Options;
using MyDemoApp.WebApi.Models;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace MyDemoApp.WebApi.Services;

public interface ITelegramBotService
{
    Task StartAsync(CancellationToken cancellationToken);
    Task StopAsync(CancellationToken cancellationToken);
    Task SendMessageAsync(long chatId, string message, CancellationToken cancellationToken = default);
}

public class TelegramBotService : ITelegramBotService
{
    private readonly ITelegramBotClient _botClient;
    private readonly TelegramConfiguration _config;
    private readonly GeminiService _geminiService;
    private readonly ILogger<TelegramBotService> _logger;
    private CancellationTokenSource? _cancellationTokenSource;

    public TelegramBotService(
        IOptions<TelegramConfiguration> config,
        GeminiService geminiService,
        ILogger<TelegramBotService> logger)
    {
        _config = config.Value;
        _geminiService = geminiService;
        _logger = logger;

        if (string.IsNullOrEmpty(_config.BotToken))
        {
            throw new InvalidOperationException("Telegram bot token is not configured.");
        }

        _botClient = new TelegramBotClient(_config.BotToken);
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _cancellationTokenSource = new CancellationTokenSource();

        var receiverOptions = new ReceiverOptions
        {
            AllowedUpdates = Array.Empty<UpdateType>() // receive all update types
        };

        _botClient.StartReceiving(
            updateHandler: HandleUpdateAsync,
            errorHandler: HandlePollingErrorAsync,
            receiverOptions: receiverOptions,
            cancellationToken: _cancellationTokenSource.Token
        );

        var me = await _botClient.GetMeAsync(cancellationToken);
        _logger.LogInformation("Telegram bot {BotName} started successfully", me.Username);
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        _cancellationTokenSource?.Cancel();
        _logger.LogInformation("Telegram bot stopped");
        await Task.CompletedTask;
    }

    public async Task SendMessageAsync(long chatId, string message, CancellationToken cancellationToken = default)
    {
        try
        {
            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: message,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message to chat {ChatId}", chatId);
            throw;
        }
    }

    private async Task HandleUpdateAsync(ITelegramBotClient botClient, Update update, CancellationToken cancellationToken)
    {
        try
        {
            if (update.Message is not { } message)
                return;

            if (message.Text is not { } messageText)
                return;

            var chatId = message.Chat.Id;
            var userId = message.From?.Id;

            _logger.LogInformation("Received message from {UserId} in chat {ChatId}: {Message}",
                userId, chatId, messageText);

            // Check if user is allowed (if AllowedUsers list is configured)
            if (_config.AllowedUsers.Any() && userId.HasValue && !_config.AllowedUsers.Contains(userId.Value))
            {
                await botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Sorry, you are not authorized to use this bot.",
                    cancellationToken: cancellationToken);
                return;
            }

            // Handle commands
            if (messageText.StartsWith("/"))
            {
                await HandleCommandAsync(botClient, message, cancellationToken);
                return;
            }

            // Process regular messages as AI prompts
            await ProcessAiRequestAsync(botClient, chatId, messageText, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling update");
        }
    }

    private async Task HandleCommandAsync(ITelegramBotClient botClient, Message message, CancellationToken cancellationToken)
    {
        var chatId = message.Chat.Id;
        var command = message.Text?.Split(' ')[0].ToLower();

        switch (command)
        {
            case "/start":
                await botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "🤖 Welcome to the AI Assistant Bot!\n\n" +
                          "Send me any message and I'll process it using Gemini AI.\n\n" +
                          "Available commands:\n" +
                          "/start - Show this welcome message\n" +
                          "/help - Show help information\n" +
                          "/model - Show current AI model\n" +
                          "/status - Show bot status",
                    cancellationToken: cancellationToken);
                break;

            case "/help":
                await botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "🆘 Help\n\n" +
                          "Simply send me any text message and I'll respond using AI.\n\n" +
                          "Examples:\n" +
                          "• What is the weather like?\n" +
                          "• Explain quantum physics\n" +
                          "• Write a poem about cats\n" +
                          "• Help me with coding\n\n" +
                          "The bot uses Gemini AI to generate responses.",
                    cancellationToken: cancellationToken);
                break;

            case "/model":
                var currentModel = _geminiService.GetCurrentModel();
                await botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: $"🧠 Current AI Model: {currentModel}",
                    cancellationToken: cancellationToken);
                break;

            case "/status":
                await botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "✅ Bot is running and ready to process your requests!",
                    cancellationToken: cancellationToken);
                break;

            default:
                await botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "❓ Unknown command. Type /help for available commands.",
                    cancellationToken: cancellationToken);
                break;
        }
    }

    private async Task ProcessAiRequestAsync(ITelegramBotClient botClient, long chatId, string prompt, CancellationToken cancellationToken)
    {
        try
        {
            // Send "typing" action to show the bot is processing
            await botClient.SendChatActionAsync(
                chatId: chatId,
                action: ChatAction.Typing,
                cancellationToken: cancellationToken);

            _logger.LogInformation("Processing AI request for chat {ChatId}: {Prompt}", chatId, prompt);

            // Get AI response
            var response = await _geminiService.GenerateTextAsync(prompt);

            if (string.IsNullOrEmpty(response))
            {
                response = "Sorry, I couldn't generate a response. Please try again.";
            }

            // Telegram has a message length limit of 4096 characters
            if (response.Length > 4096)
            {
                // Split long messages
                var chunks = SplitMessage(response, 4096);
                foreach (var chunk in chunks)
                {
                    await botClient.SendTextMessageAsync(
                        chatId: chatId,
                        text: chunk,
                        cancellationToken: cancellationToken);

                    // Small delay between chunks to avoid rate limiting
                    await Task.Delay(100, cancellationToken);
                }
            }
            else
            {
                await botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: response,
                    cancellationToken: cancellationToken);
            }

            _logger.LogInformation("AI response sent to chat {ChatId}", chatId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing AI request for chat {ChatId}", chatId);

            await botClient.SendTextMessageAsync(
                chatId: chatId,
                text: "❌ Sorry, there was an error processing your request. Please try again later.",
                cancellationToken: cancellationToken);
        }
    }

    private static List<string> SplitMessage(string message, int maxLength)
    {
        var chunks = new List<string>();

        while (message.Length > maxLength)
        {
            var splitIndex = message.LastIndexOf('\n', maxLength);
            if (splitIndex == -1)
                splitIndex = message.LastIndexOf(' ', maxLength);
            if (splitIndex == -1)
                splitIndex = maxLength;

            chunks.Add(message[..splitIndex]);
            message = message[splitIndex..].TrimStart();
        }

        if (!string.IsNullOrEmpty(message))
            chunks.Add(message);

        return chunks;
    }

    private Task HandlePollingErrorAsync(ITelegramBotClient botClient, Exception exception, CancellationToken cancellationToken)
    {
        var errorMessage = exception switch
        {
            ApiRequestException apiRequestException
                => $"Telegram API Error:\n[{apiRequestException.ErrorCode}]\n{apiRequestException.Message}",
            _ => exception.ToString()
        };

        _logger.LogError(exception, "Telegram polling error: {ErrorMessage}", errorMessage);
        return Task.CompletedTask;
    }
}
