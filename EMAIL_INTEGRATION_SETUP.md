# Email Integration Setup Guide

## Overview

Your MyDemoApp.WebApi now supports responding to emails via Gmail! When someone sends an email with the subject "AI Request" to your configured Gmail account, the system will:

1. Read the email content
2. Process it through your Gemini AI service
3. Send back an AI-generated response

## Prerequisites

### 1. Gmail App Password Setup

Since Gmail requires App Passwords for third-party applications:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### 2. Update Configuration

Edit your `appsettings.json` file and add your Gmail credentials:

```json
{
  "Email": {
    "Gmail": {
      "Username": "your-email@gmail.com",
      "Password": "your-app-password-here"
    }
  }
}
```

**Important**: Use the App Password, not your regular Gmail password!

## How It Works

### Email Processing Flow

1. **Background Service**: Runs every minute (configurable) checking for new emails
2. **Email Detection**: Looks for unread emails with subject containing "AI Request"
3. **Content Extraction**: Extracts the main content from the email body
4. **AI Processing**: Sends the content to your Gemini service
5. **Response**: Sends back an email with the AI response

### Email Format

**To send a request:**
- **To**: your-configured-gmail@gmail.com
- **Subject**: AI Request (or any subject containing "AI Request")
- **Body**: Your question or prompt for the AI

**Response format:**
```
Hello!

Thank you for your AI request. Here's the response to your query:

Your Request:
[Original prompt]

AI Response:
[AI generated response]

---
This is an automated response from the AI Assistant.
If you have another question, please send a new email with the subject "AI Request".
```

## Configuration Options

In `appsettings.json`, you can customize:

```json
{
  "Email": {
    "Gmail": {
      "Username": "your-email@gmail.com",
      "Password": "your-app-password",
      "ImapServer": "imap.gmail.com",
      "ImapPort": 993,
      "SmtpServer": "smtp.gmail.com",
      "SmtpPort": 587,
      "UseSsl": true
    },
    "TriggerSubject": "AI Request",        // Subject that triggers processing
    "CheckIntervalMinutes": 1,             // How often to check for emails
    "MarkAsRead": true                     // Whether to mark emails as read after processing
  }
}
```

## API Endpoints

The system adds several new endpoints:

### Check Email Service Status
```
GET /api/email/status
```
Returns configuration status and settings.

### Manually Process Emails
```
POST /api/email/process
```
Manually trigger email processing (useful for testing).

### Send Test Email
```
POST /api/email/test
Content-Type: application/json

{
  "toEmail": "recipient@example.com"
}
```

## Testing the Setup

1. **Check Status**: Call `GET /api/email/status` to verify configuration
2. **Send Test Email**: Use `POST /api/email/test` to send a test email
3. **Manual Processing**: Use `POST /api/email/process` to manually check for emails
4. **End-to-End Test**: Send an email to your Gmail with subject "AI Request"

## Security Considerations

1. **App Passwords**: Always use Gmail App Passwords, never your main password
2. **Configuration**: Keep your `appsettings.json` secure and don't commit credentials to version control
3. **Rate Limiting**: Gmail has rate limits - the default 1-minute check interval is reasonable
4. **Email Validation**: The system validates email content to prevent abuse

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Verify you're using an App Password, not your regular password
   - Ensure 2FA is enabled on your Gmail account

2. **"No emails found"**
   - Check the subject line contains "AI Request"
   - Verify emails are unread
   - Check the `TriggerSubject` configuration

3. **"Email service not starting"**
   - Verify Gmail credentials are configured in `appsettings.json`
   - Check the application logs for detailed error messages

### Logs

The system provides detailed logging:
- Email check attempts
- Processing status
- Error details
- Response sending confirmation

Check your application logs for troubleshooting information.

## Production Considerations

1. **Monitoring**: Set up monitoring for the background service
2. **Error Handling**: The system includes comprehensive error handling
3. **Scalability**: For high volume, consider implementing queuing
4. **Security**: Consider implementing additional validation and rate limiting

## Example Usage

1. Someone sends an email:
   ```
   To: your-ai-assistant@gmail.com
   Subject: AI Request - Help with coding
   Body: Can you explain how async/await works in C#?
   ```

2. Your system processes it and responds:
   ```
   Subject: Re: AI Request - Help with coding
   Body: 
   Hello!

   Thank you for your AI request. Here's the response to your query:

   Your Request:
   Can you explain how async/await works in C#?

   AI Response:
   Async/await in C# is a programming pattern that allows you to write asynchronous code that looks and behaves like synchronous code...
   [Full AI response]
   ```

The system is now ready to handle email-based AI requests!