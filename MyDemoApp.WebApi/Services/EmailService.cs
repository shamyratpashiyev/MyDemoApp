using MailKit.Net.Imap;
using MailKit.Net.Smtp;
using MailKit.Search;
using MailKit.Security;
using MailKit;
using MimeKit;
using MyDemoApp.WebApi.Models;
using Microsoft.Extensions.Options;

namespace MyDemoApp.WebApi.Services;

public interface IEmailService
{
    Task<List<EmailMessage>> GetUnreadEmailsAsync();
    Task SendEmailAsync(string toEmail, string subject, string body, string? inReplyToMessageId = null);
    Task MarkEmailAsReadAsync(UniqueId uid);
}

public class EmailService : IEmailService
{
    private readonly EmailConfiguration _emailConfig;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailConfiguration> emailConfig, ILogger<EmailService> logger)
    {
        _emailConfig = emailConfig.Value;
        _logger = logger;
    }

    public async Task<List<EmailMessage>> GetUnreadEmailsAsync()
    {
        var emails = new List<EmailMessage>();

        try
        {
            using var client = new ImapClient();
            await client.ConnectAsync(_emailConfig.Gmail.ImapServer, _emailConfig.Gmail.ImapPort, SecureSocketOptions.SslOnConnect);
            await client.AuthenticateAsync(_emailConfig.Gmail.Username, _emailConfig.Gmail.Password);

            var inbox = client.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadWrite);

            // Search for unread emails with the trigger subject
            var query = SearchQuery.And(
                SearchQuery.NotSeen,
                SearchQuery.SubjectContains(_emailConfig.TriggerSubject)
            );

            var uids = await inbox.SearchAsync(query);

            foreach (var uid in uids)
            {
                var message = await inbox.GetMessageAsync(uid);
                
                emails.Add(new EmailMessage
                {
                    Uid = uid,
                    From = message.From.ToString(),
                    Subject = message.Subject ?? string.Empty,
                    Body = GetTextBody(message),
                    MessageId = message.MessageId ?? string.Empty,
                    Date = message.Date.DateTime
                });

                // Mark as read if configured to do so
                if (_emailConfig.MarkAsRead)
                {
                    await inbox.AddFlagsAsync(uid, MessageFlags.Seen, true);
                }
            }

            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading emails from Gmail");
            throw;
        }

        return emails;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body, string? inReplyToMessageId = null)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("AI Assistant", _emailConfig.Gmail.Username));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;

            if (!string.IsNullOrEmpty(inReplyToMessageId))
            {
                message.InReplyTo = inReplyToMessageId;
            }

            var bodyBuilder = new BodyBuilder
            {
                TextBody = body
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_emailConfig.Gmail.SmtpServer, _emailConfig.Gmail.SmtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_emailConfig.Gmail.Username, _emailConfig.Gmail.Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"Email sent successfully to {toEmail}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending email to {toEmail}");
            throw;
        }
    }

    public async Task MarkEmailAsReadAsync(UniqueId uid)
    {
        try
        {
            using var client = new ImapClient();
            await client.ConnectAsync(_emailConfig.Gmail.ImapServer, _emailConfig.Gmail.ImapPort, SecureSocketOptions.SslOnConnect);
            await client.AuthenticateAsync(_emailConfig.Gmail.Username, _emailConfig.Gmail.Password);

            var inbox = client.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadWrite);
            await inbox.AddFlagsAsync(uid, MessageFlags.Seen, true);

            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error marking email {uid} as read");
            throw;
        }
    }

    private string GetTextBody(MimeMessage message)
    {
        if (message.TextBody != null)
            return message.TextBody;

        if (message.HtmlBody != null)
        {
            // Simple HTML to text conversion - you might want to use a more sophisticated library
            return System.Text.RegularExpressions.Regex.Replace(message.HtmlBody, "<.*?>", string.Empty);
        }

        return string.Empty;
    }
}

public class EmailMessage
{
    public UniqueId Uid { get; set; }
    public string From { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string MessageId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}