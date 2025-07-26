# Telegram Bot Integration Guide

This guide explains how to integrate and configure the Telegram bot with your MyDemoApp.WebApi application.

## Overview

The Telegram bot integration allows users to interact with your Gemini AI service through Telegram messages. The bot can:

- Process text messages as AI prompts
- Return AI-generated responses
- Handle bot commands (/start, /help, /model, /status)
- Support user authorization (optional)
- Split long responses into multiple messages

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a conversation with BotFather
3. Send `/newbot` command
4. Follow the instructions to create your bot:
   - Choose a name for your bot (e.g., "MyDemoApp AI Assistant")
   - Choose a username for your bot (must end with 'bot', e.g., "mydemoapp_ai_bot")
5. BotFather will provide you with a bot token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Configure the Bot Token

1. Open `appsettings.json` in your WebApi project
2. Replace `YOUR_BOT_TOKEN_HERE` with your actual bot token:

```json
{
  "Telegram": {
    "BotToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
    "WebhookUrl": "",
    "AllowedUsers": []
  }
}
```

### 3. Optional: Configure User Authorization

If you want to restrict bot access to specific users:

1. Get user IDs by temporarily allowing all users and checking the logs when they message the bot
2. Add user IDs to the `AllowedUsers` array:

```json
{
  "Telegram": {
    "BotToken": "your_bot_token",
    "WebhookUrl": "",
    "AllowedUsers": [123456789, 987654321]
  }
}
```

Leave the array empty `[]` to allow all users.

### 4. Install Dependencies

Run the following command in your WebApi project directory:

```bash
dotnet restore
```

### 5. Run the Application

```bash
dotnet run
```

The bot will automatically start when the application launches.

## Features

### Bot Commands

- `/start` - Welcome message and bot introduction
- `/help` - Show help information and usage examples
- `/model` - Display the current AI model being used
- `/status` - Check if the bot is running properly

### AI Processing

- Send any text message to get an AI-generated response
- Long responses are automatically split into multiple messages
- The bot shows "typing" indicator while processing

### API Endpoints

The integration adds the following API endpoints:

- `GET /api/telegram/status` - Check bot configuration status
- `POST /api/telegram/send` - Send messages programmatically

## Architecture

### Services Added

1. **TelegramBotService** (`ITelegramBotService`)
   - Handles Telegram API communication
   - Processes incoming messages and commands
   - Integrates with GeminiService for AI responses

2. **TelegramBackgroundService**
   - Manages bot lifecycle as a background service
   - Starts/stops the bot with the application

### Configuration Models

1. **TelegramConfiguration**
   - Bot token configuration
   - Webhook URL (for future webhook support)
   - Allowed users list

2. **TelegramSendMessageRequest**
   - Model for programmatic message sending

## Usage Examples

### Basic Conversation

```
User: Hello!
Bot: 🤖 Welcome to the AI Assistant Bot!

Send me any message and I'll process it using Gemini AI.

Available commands:
/start - Show this welcome message
/help - Show help information
/model - Show current AI model
/status - Show bot status

User: What is machine learning?
Bot: [AI-generated response about machine learning]
```

### Commands

```
User: /model
Bot: 🧠 Current AI Model: gemini-1.5-flash

User: /status
Bot: ✅ Bot is running and ready to process your requests!
```

## Troubleshooting

### Bot Not Responding

1. Check that the bot token is correctly configured
2. Verify the application is running
3. Check application logs for errors
4. Ensure the bot is not blocked by the user

### Authorization Issues

1. If using `AllowedUsers`, ensure user IDs are correct
2. Check logs to see actual user IDs when they message the bot
3. Temporarily remove user restrictions to test

### API Errors

1. Check Gemini API key configuration
2. Verify internet connectivity
3. Check rate limiting on Telegram Bot API

## Security Considerations

1. **Bot Token Security**: Keep your bot token secret and never commit it to version control
2. **User Authorization**: Use the `AllowedUsers` feature in production to restrict access
3. **Rate Limiting**: The bot includes basic rate limiting to avoid Telegram API limits
4. **Input Validation**: All user inputs are validated before processing

## Future Enhancements

Potential improvements that could be added:

1. **Webhook Support**: Use webhooks instead of polling for better performance
2. **Message History**: Store conversation history in the database
3. **File Support**: Handle document and image uploads
4. **Inline Keyboards**: Add interactive buttons for common actions
5. **Multi-language Support**: Support multiple languages
6. **Usage Analytics**: Track bot usage and popular queries

## Logs and Monitoring

The bot logs important events:

- Bot startup/shutdown
- Message processing
- Errors and exceptions
- User authorization attempts

Check your application logs to monitor bot activity and troubleshoot issues.