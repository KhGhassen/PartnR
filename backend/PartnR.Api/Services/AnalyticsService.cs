using Microsoft.EntityFrameworkCore;
using PartnR.Api.Data;
using PartnR.Api.DTOs.Analytics;
using PartnR.Api.Entities;

namespace PartnR.Api.Services;

public class AnalyticsService
{
    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db) => _db = db;

    public async Task TrackAsync(Guid? userId, string action, string? entityType, Guid? entityId, string? metadata)
    {
        _db.UserActions.Add(new UserAction
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Metadata = metadata
        });
        await _db.SaveChangesAsync();
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var now = DateTime.UtcNow;
        var weekAgo = now.AddDays(-7);
        var monthAgo = now.AddDays(-30);

        var totalUsers = await _db.Users.CountAsync();
        var totalEvents = await _db.Events.CountAsync();
        var totalActions = await _db.UserActions.CountAsync();
        var todayActions = await _db.UserActions.CountAsync(a => a.CreatedAt >= now.Date);

        var actionsByDay = await _db.UserActions
            .Where(a => a.CreatedAt >= weekAgo)
            .GroupBy(a => a.CreatedAt.Date)
            .Select(g => new ActionByDayDto { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync();

        var actionsByType = await _db.UserActions
            .Where(a => a.CreatedAt >= monthAgo)
            .GroupBy(a => a.Action)
            .Select(g => new ActionByTypeDto { Action = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        var topEvents = await _db.Events
            .OrderByDescending(e => e.Participants.Count)
            .Take(5)
            .Select(e => new TopEventDto
            {
                Id = e.Id,
                Title = e.Title,
                City = e.City,
                ParticipantCount = e.Participants.Count(p => p.Status == ParticipantStatus.Confirmed)
            })
            .ToListAsync();

        var newUsersLast7Days = await _db.Users
            .CountAsync(u => u.CreatedAt >= weekAgo);

        return new DashboardDto
        {
            TotalUsers = totalUsers,
            TotalEvents = totalEvents,
            TotalActions = totalActions,
            TodayActions = todayActions,
            NewUsersLast7Days = newUsersLast7Days,
            ActionsByDay = actionsByDay,
            ActionsByType = actionsByType,
            TopEvents = topEvents
        };
    }
}
