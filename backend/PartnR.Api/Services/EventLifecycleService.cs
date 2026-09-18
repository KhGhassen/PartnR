using Microsoft.EntityFrameworkCore;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Api.Services;

// Closes the loop nothing else did: no code path ever wrote EventStatus.Completed,
// so RatingService — which refuses any rating on a non-completed event — was dead
// code in production, every profile sat at "0 avis", and the "Terminés" tab was
// permanently empty.
//
// Flips past events to Completed after a grace period and invites participants to
// rate each other.
public class EventLifecycleService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(30);

    // Long enough that an event running late is not closed under its participants.
    private static readonly TimeSpan Grace = TimeSpan.FromHours(6);

    // On the very first pass every past event flips at once. Only events that
    // ended recently are worth a notification — the rest close silently.
    private static readonly TimeSpan NotifyWindow = TimeSpan.FromDays(7);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EventLifecycleService> _logger;

    public EventLifecycleService(IServiceScopeFactory scopeFactory, ILogger<EventLifecycleService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CompletePastEventsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Event lifecycle pass failed");
            }
            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task CompletePastEventsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;
        var cutoff = now - Grace;

        var ended = await db.Events
            .Include(e => e.Participants)
            .Where(e => e.Status == EventStatus.Published && e.Date < cutoff)
            .Take(200)
            .ToListAsync(ct);

        if (ended.Count == 0) return;

        var notifyAfter = now - NotifyWindow;
        var notified = 0;

        foreach (var ev in ended)
        {
            ev.Status = EventStatus.Completed;

            // Nothing to rate when the organiser was alone.
            var confirmed = ev.Participants.Where(p => p.Status == ParticipantStatus.Confirmed).ToList();
            if (confirmed.Count < 2 || ev.Date < notifyAfter) continue;

            foreach (var p in confirmed)
            {
                db.Notifications.Add(new Notification
                {
                    UserId = p.UserId,
                    Type = "event_completed",
                    Message = $"Comment s'est passé « {ev.Title} » ? Notez vos partenaires.",
                    EventId = ev.Id,
                });
                notified++;
            }
        }

        await db.SaveChangesAsync(ct);
        _logger.LogInformation("Completed {Events} event(s), {Notifications} rating invitation(s)", ended.Count, notified);
    }
}
