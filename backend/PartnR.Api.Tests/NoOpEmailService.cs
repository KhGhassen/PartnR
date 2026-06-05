using PartnR.Api.Services;

namespace PartnR.Api.Tests;

internal sealed class NoOpEmailService : IEmailService
{
    public Task SendAsync(string to, string subject, string htmlBody) => Task.CompletedTask;
}
