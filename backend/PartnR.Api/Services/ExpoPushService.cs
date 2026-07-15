using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PartnR.Infrastructure.Data;

namespace PartnR.Api.Services;

// Dispatches unsent in-app notifications as Expo push messages.
// Decoupled from the emission sites: anything that inserts a Notification
// (joins, cancellations, questions, reminders…) gets pushed within ~30s.
public class ExpoPushService : BackgroundService
{
    private const string ExpoPushUrl = "https://exp.host/--/api/v2/push/send";
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ExpoPushService> _logger;

    public ExpoPushService(IServiceScopeFactory scopeFactory, IHttpClientFactory httpClientFactory, ILogger<ExpoPushService> logger)
    {
        _scopeFactory = scopeFactory;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DispatchAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Push dispatch pass failed");
            }
            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task DispatchAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pending = await db.Notifications
            .Where(n => !n.PushSent)
            .OrderBy(n => n.CreatedAt)
            .Take(100)
            .ToListAsync(ct);
        if (pending.Count == 0) return;

        var userIds = pending.Select(n => n.UserId).Distinct().ToList();
        var tokensByUser = (await db.PushTokens
                .Where(t => userIds.Contains(t.UserId))
                .ToListAsync(ct))
            .GroupBy(t => t.UserId)
            .ToDictionary(g => g.Key, g => g.Select(t => t.Token).ToList());

        var messages = pending
            .SelectMany(n => tokensByUser.GetValueOrDefault(n.UserId, [])
                .Select(token => new
                {
                    to = token,
                    title = "PartnR",
                    body = n.Message,
                    sound = "default",
                    data = new { eventId = n.EventId },
                }))
            .ToList();

        if (messages.Count > 0)
        {
            var client = _httpClientFactory.CreateClient();
            foreach (var batch in messages.Chunk(100))
            {
                var payload = new StringContent(JsonSerializer.Serialize(batch), Encoding.UTF8, "application/json");
                var response = await client.PostAsync(ExpoPushUrl, payload, ct);
                if (!response.IsSuccessStatusCode)
                    _logger.LogWarning("Expo push returned {Status}", response.StatusCode);
            }
        }

        // Mark processed even without tokens, so we don't retry forever.
        foreach (var n in pending) n.PushSent = true;
        await db.SaveChangesAsync(ct);

        if (messages.Count > 0)
            _logger.LogInformation("Pushed {Messages} message(s) for {Notifications} notification(s)", messages.Count, pending.Count);
    }
}
