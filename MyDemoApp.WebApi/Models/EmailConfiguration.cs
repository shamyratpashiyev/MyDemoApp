namespace MyDemoApp.WebApi.Models;

public class EmailConfiguration
{
    public GmailConfiguration Gmail { get; set; } = new();
    public string TriggerSubject { get; set; } = "AI Request";
    public int CheckIntervalMinutes { get; set; } = 1;
    public bool MarkAsRead { get; set; } = true;
}

public class GmailConfiguration
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ImapServer { get; set; } = "imap.gmail.com";
    public int ImapPort { get; set; } = 993;
    public string SmtpServer { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
}