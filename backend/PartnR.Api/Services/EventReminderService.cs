using Microsoft.EntityFrameworkCore;
using PartnR.Application.Common;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Api.Services;

// Reminds each confirmed participant (in-app notification, pushed by
// ExpoPushService, plus an email) once per event within the last 24 hours
// before it starts.
public class EventReminderService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(30);
    public static readonly TimeSpan Horizon = TimeSpan.FromHours(24);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EventReminderService> _logger;

    public EventReminderService(IServiceScopeFactory scopeFactory, ILogger<EventReminderService> logger)
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
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
                await RunOnceAsync(db, email, DateTime.UtcNow, _logger, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Event reminder pass failed");
            }
            await Task.Delay(Interval, stoppingToken);
        }
    }

    /// <summary>One reminder pass. Public and clock-injected so tests can drive it.</summary>
    public static async Task<int> RunOnceAsync(AppDbContext db, IEmailService email, DateTime now, ILogger logger, CancellationToken ct)
    {
        var until = now.Add(Horizon);
        var due = await db.EventParticipants
            .Include(p => p.Event)
            .Include(p => p.User)
            .Where(p => p.Status == ParticipantStatus.Confirmed
                        && p.ReminderSentAt == null
                        && p.Event.Status == EventStatus.Published
                        && p.Event.Date > now
                        && p.Event.Date <= until)
            .ToListAsync(ct);

        var sent = 0;
        foreach (var group in due.GroupBy(p => p.EventId))
        {
            var batch = group.ToList();
            var ev = batch[0].Event;
            var when = FrenchDate.Relative(ev.Date, now);

            foreach (var p in batch)
            {
                db.Notifications.Add(new Notification
                {
                    UserId = p.UserId,
                    Type = "event_reminder",
                    Message = $"Rappel : « {ev.Title} » a lieu {when}.",
                    EventId = ev.Id,
                });
                p.ReminderSentAt = now;
            }

            // Persist BEFORE emailing: a crash between the two costs an email
            // (the push/in-app copy is already saved), never a duplicate reminder.
            await db.SaveChangesAsync(ct);
            sent += batch.Count;

            var place = string.IsNullOrEmpty(ev.Location) ? ev.City : $"{ev.City} ({ev.Location})";
            foreach (var p in batch)
            {
                if (string.IsNullOrEmpty(p.User?.Email)) continue;
                try
                {
                    await email.SendAsync(
                        p.User.Email,
                        $"Rappel — {ev.Title}, c'est {when}",
                        $"<p>Bonjour {p.User.FirstName},</p><p>Petit rappel : <strong>{ev.Title}</strong> a lieu {when} à {place}.</p><p>À très vite sur PartnR !</p>");
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Reminder email failed for {Email}", p.User.Email);
                }
            }
        }

        if (sent > 0)
            logger.LogInformation("Sent {Count} reminder(s) across {Events} event(s)", sent, due.Select(p => p.EventId).Distinct().Count());
        return sent;
    }
}
