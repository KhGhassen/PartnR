using Microsoft.EntityFrameworkCore;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Services;

// Lives in Infrastructure on purpose: it has to reach every table, including
// the five with no foreign key to the user (Notifications, PushTokens,
// StoredImages, Reports, UserActions), and the Ratings/EventPhotos rows whose
// FK is RESTRICT and would otherwise block the delete.
//
// There was no way to delete an account at all — a GDPR obligation, and a hard
// App Store requirement (5.1.1(v)) before the mobile app can be listed.
public class AccountDeletionService : IAccountService
{
    private readonly AppDbContext _db;

    public AccountDeletionService(AppDbContext db) => _db = db;

    public async Task DeleteAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Compte introuvable.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Rows that reference the user without a cascading FK.
        await _db.Ratings.Where(r => r.RaterId == userId || r.RatedUserId == userId).ExecuteDeleteAsync();
        await _db.EventPhotos.Where(p => p.UploaderId == userId).ExecuteDeleteAsync();
        await _db.StoredImages.Where(i => i.UploaderId == userId).ExecuteDeleteAsync();
        await _db.Notifications.Where(n => n.UserId == userId).ExecuteDeleteAsync();
        await _db.PushTokens.Where(t => t.UserId == userId).ExecuteDeleteAsync();
        await _db.Reports.Where(r => r.ReporterId == userId).ExecuteDeleteAsync();
        await _db.UserActions.Where(a => a.UserId == userId).ExecuteDeleteAsync();

        // Participants of the events this user organised must not learn about
        // it from a 404: cancel those events first so the cancellation
        // notifications go out, then let the cascade remove them.
        var organised = await _db.Events
            .Include(e => e.Participants)
            .Where(e => e.CreatorId == userId && e.Status == EventStatus.Published)
            .ToListAsync();
        foreach (var ev in organised)
        {
            foreach (var p in ev.Participants.Where(p => p.UserId != userId && p.Status == ParticipantStatus.Confirmed))
            {
                _db.Notifications.Add(new Notification
                {
                    UserId = p.UserId,
                    Type = "event_cancelled",
                    Message = $"L'événement « {ev.Title} » a été annulé : son organisateur a quitté PartnR.",
                    EventId = null,
                });
            }
        }
        await _db.SaveChangesAsync();

        // Events (→ participants, messages, comments), participations,
        // messages and Identity rows cascade from the user.
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
    }
}
