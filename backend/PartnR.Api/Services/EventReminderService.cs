using Microsoft.EntityFrameworkCore;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Api.Services;

// Sends a reminder (in-app notification + email) to confirmed participants
// of events happening within the next 24 hours.
public class EventReminderService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(30);

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
                await SendRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Event reminder pass failed");
            }
            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task SendRemindersAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTime.UtcNow;
        var upcoming = await db.Events
            .Include(e => e.Participants).ThenInclude(p => p.User)
            .Where(e => e.Status == EventStatus.Published
                        && !e.ReminderSent
                        && e.Date > now
                        && e.Date <= now.AddHours(24))
            .ToListAsync(ct);

        foreach (var ev in upcoming)
        {
            var when = ev.Date.ToString("dddd d MMMM 'à' HH:mm", new System.Globalization.CultureInfo("fr-FR"));
            foreach (var p in ev.Participants.Where(p => p.Status == ParticipantStatus.Confirmed))
            {
                db.Notifications.Add(new Notification
                {
                    UserId = p.UserId,
                    Type = "event_reminder",
                    Message = $"Rappel : « {ev.Title} » a lieu {when}.",
                    EventId = ev.Id,
                });

                if (!string.IsNullOrEmpty(p.User?.Email))
                {
                    try
                    {
                        await email.SendAsync(
                            p.User.Email,
                            $"Rappel — {ev.Title} c'est demain !",
                            $"<p>Bonjour {p.User.FirstName},</p><p>Petit rappel : <strong>{ev.Title}</strong> a lieu {when} à {ev.City}{(string.IsNullOrEmpty(ev.Location) ? "" : $" ({ev.Location})")}.</p><p>À très vite sur PartnR !</p>");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Reminder email failed for {Email}", p.User.Email);
                    }
                }
            }

            ev.ReminderSent = true;
        }

        if (upcoming.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("Sent reminders for {Count} event(s)", upcoming.Count);
        }
    }
}
