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
    private const int MaxAttempts = 5;

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

        var now = DateTime.UtcNow;
        var pending = await db.Notifications
            .Where(n => !n.PushSent && (n.PushNextAttemptAt == null || n.PushNextAttemptAt <= now))
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

        // Notifications without any device token are done: nothing to deliver.
        var deliverable = pending.Where(n => tokensByUser.ContainsKey(n.UserId)).ToList();
        foreach (var n in pending.Except(deliverable)) n.PushSent = true;

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        var sent = 0;

        // One HTTP call per chunk, outcome recorded per chunk: a failed chunk is
        // retried with backoff instead of being marked sent, and gives up after
        // MaxAttempts — the in-app notification remains either way.
        foreach (var chunk in deliverable.Chunk(50))
        {
            var messages = chunk
                .SelectMany(n => tokensByUser[n.UserId].Select(token => new
                {
                    to = token,
                    title = "PartnR",
                    body = n.Message,
                    sound = "default",
                    data = new { eventId = n.EventId, type = n.Type },
                }))
                .ToList();

            var ok = false;
            try
            {
                var payload = new StringContent(JsonSerializer.Serialize(messages), Encoding.UTF8, "application/json");
                var response = await client.PostAsync(ExpoPushUrl, payload, ct);
                ok = response.IsSuccessStatusCode;
                if (!ok) _logger.LogWarning("Expo push returned {Status}", response.StatusCode);
            }
            catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Expo push call failed");
            }

            foreach (var n in chunk)
            {
                if (ok)
                {
                    n.PushSent = true;
                    sent++;
                    continue;
                }
                n.PushAttempts++;
                if (n.PushAttempts >= MaxAttempts)
                {
                    n.PushSent = true; // give up; the bell still shows it
                    _logger.LogWarning("Push abandoned after {Attempts} attempts for notification {Id}", n.PushAttempts, n.Id);
                }
                else
                {
                    n.PushNextAttemptAt = now.AddMinutes(Math.Pow(2, n.PushAttempts)); // 2, 4, 8, 16 min
                }
            }
        }

        await db.SaveChangesAsync(ct);

        if (sent > 0)
            _logger.LogInformation("Pushed {Sent} notification(s)", sent);
    }
}
