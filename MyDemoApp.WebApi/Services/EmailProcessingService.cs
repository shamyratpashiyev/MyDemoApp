using MyDemoApp.WebApi.Models;
using Microsoft.Extensions.Options;

namespace MyDemoApp.WebApi.Services;

public interface IEmailProcessingService
{
    Task ProcessEmailsAsync();
}

public class EmailProcessingService : IEmailProcessingService
{
    private readonly IEmailService _emailService;
    private readonly GeminiService _geminiService;
    private readonly EmailConfiguration _emailConfig;
    private readonly ILogger<EmailProcessingService> _logger;

    public EmailProcessingService(
        IEmailService emailService,
        GeminiService geminiService,
        IOptions<EmailConfiguration> emailConfig,
        ILogger<EmailProcessingService> logger)
    {
        _emailService = emailService;
        _geminiService = geminiService;
        _emailConfig = emailConfig.Value;
        _logger = logger;
    }

    public async Task ProcessEmailsAsync()
    {
        try
        {
            _logger.LogInformation("Checking for new emails...");
            
            var emails = await _emailService.GetUnreadEmailsAsync();
            
            if (emails.Count == 0)
            {
                _logger.LogInformation("No new emails found.");
                return;
            }

            _logger.LogInformation($"Found {emails.Count} new email(s) to process.");

            foreach (var email in emails)
            {
                await ProcessSingleEmailAsync(email);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing emails");
        }
    }

    private async Task ProcessSingleEmailAsync(EmailMessage email)
    {
        try
        {
            _logger.LogInformation($"Processing email from {email.From} with subject: {email.Subject}");

            // Extract the prompt from the email body
            var prompt = ExtractPromptFromEmail(email.Body);
            
            if (string.IsNullOrWhiteSpace(prompt))
            {
                _logger.LogWarning($"No valid prompt found in email from {email.From}");
                await SendErrorResponseAsync(email, "No valid prompt found in your email. Please include your AI request in the email body.");
                return;
            }

            _logger.LogInformation($"Extracted prompt: {prompt}");

            // Generate AI response
            var aiResponse = await _geminiService.GenerateTextAsync(prompt);

            if (string.IsNullOrWhiteSpace(aiResponse))
            {
                _logger.LogWarning($"AI service returned empty response for email from {email.From}");
                await SendErrorResponseAsync(email, "Sorry, I couldn't generate a response to your request. Please try again.");
                return;
            }

            // Send response email
            var responseSubject = $"Re: {email.Subject}";
            var responseBody = FormatResponseEmail(prompt, aiResponse);

            await _emailService.SendEmailAsync(
                ExtractEmailAddress(email.From),
                responseSubject,
                responseBody,
                email.MessageId
            );

            _logger.LogInformation($"Successfully processed and responded to email from {email.From}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error processing email from {email.From}");
            
            try
            {
                await SendErrorResponseAsync(email, "Sorry, there was an error processing your request. Please try again later.");
            }
            catch (Exception sendEx)
            {
                _logger.LogError(sendEx, $"Failed to send error response to {email.From}");
            }
        }
    }

    private string ExtractPromptFromEmail(string emailBody)
    {
        if (string.IsNullOrWhiteSpace(emailBody))
            return string.Empty;

        // Clean up the email body - remove common email signatures, replies, etc.
        var lines = emailBody.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var promptLines = new List<string>();

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            
            // Skip common email artifacts
            if (trimmedLine.StartsWith(">") || // Quoted text
                trimmedLine.StartsWith("On ") && trimmedLine.Contains("wrote:") || // Reply headers
                trimmedLine.StartsWith("From:") ||
                trimmedLine.StartsWith("To:") ||
                trimmedLine.StartsWith("Subject:") ||
                trimmedLine.StartsWith("Date:") ||
                trimmedLine.Contains("@") && trimmedLine.Contains(".com") && trimmedLine.Length < 50) // Likely email addresses
            {
                continue;
            }

            // Stop at common signature indicators
            if (trimmedLine.StartsWith("--") ||
                trimmedLine.StartsWith("Best regards") ||
                trimmedLine.StartsWith("Sincerely") ||
                trimmedLine.StartsWith("Thanks"))
            {
                break;
            }

            if (!string.IsNullOrWhiteSpace(trimmedLine))
            {
                promptLines.Add(trimmedLine);
            }
        }

        return string.Join(" ", promptLines).Trim();
    }

    private string ExtractEmailAddress(string fromField)
    {
        // Extract email address from "Name <email@domain.com>" format
        var match = System.Text.RegularExpressions.Regex.Match(fromField, @"<([^>]+)>");
        if (match.Success)
        {
            return match.Groups[1].Value;
        }

        // If no angle brackets, assume the whole string is the email
        return fromField.Trim();
    }

    private string FormatResponseEmail(string originalPrompt, string aiResponse)
    {
        return $@"Hello!

Thank you for your AI request. Here's the response to your query:

Your Request:
{originalPrompt}

AI Response:
{aiResponse}

---
This is an automated response from the AI Assistant.
If you have another question, please send a new email with the subject ""{_emailConfig.TriggerSubject}"".";
    }

    private async Task SendErrorResponseAsync(EmailMessage originalEmail, string errorMessage)
    {
        var responseSubject = $"Re: {originalEmail.Subject}";
        var responseBody = $@"Hello!

{errorMessage}

Please make sure to:
1. Include your AI request in the email body
2. Use the subject ""{_emailConfig.TriggerSubject}""

---
This is an automated response from the AI Assistant.";

        await _emailService.SendEmailAsync(
            ExtractEmailAddress(originalEmail.From),
            responseSubject,
            responseBody,
            originalEmail.MessageId
        );
    }
}