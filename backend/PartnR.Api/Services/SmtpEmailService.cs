using System.Net;
using System.Net.Mail;

namespace PartnR.Api.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        var section = _config.GetSection("Email");
        var host = section["SmtpHost"];

        if (string.IsNullOrEmpty(host))
        {
            _logger.LogInformation("Email not configured — skipping send to {To}: {Subject}", to, subject);
            return;
        }

        var port = int.Parse(section["SmtpPort"] ?? "587");
        var username = section["Username"];
        var password = section["Password"];
        var fromAddress = section["FromAddress"] ?? "noreply@partnr.app";
        var fromName = section["FromName"] ?? "PartnR";

#pragma warning disable CA2109, SYSLIB0045
        using var client = new SmtpClient(host, port)
        {
            EnableSsl = true,
            Credentials = !string.IsNullOrEmpty(username)
                ? new NetworkCredential(username, password)
                : null
        };

        using var message = new MailMessage
        {
            From = new MailAddress(fromAddress, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        message.To.Add(to);

        await client.SendMailAsync(message);
#pragma warning restore CA2109, SYSLIB0045
    }
}
