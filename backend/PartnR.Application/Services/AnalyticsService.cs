using Microsoft.EntityFrameworkCore;
using PartnR.Application.DTOs.Analytics;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly IUserRepository _users;
    private readonly IEventRepository _events;
    private readonly IUserActionRepository _userActions;

    public AnalyticsService(IUserRepository users, IEventRepository events, IUserActionRepository userActions)
    {
        _users = users;
        _events = events;
        _userActions = userActions;
    }

    public async Task<DashboardDto> GetDashboardAsync(Guid requestingUserId)
    {
        var requestingUser = await _users.FindAsync(requestingUserId);
        if (requestingUser is null || requestingUser.Role != "admin")
            throw new UnauthorizedAccessException("Admin access required.");

        var now = DateTime.UtcNow;
        var weekAgo = now.AddDays(-7);
        var monthAgo = now.AddDays(-30);

        var totalUsers = await _users.Query().CountAsync();
        var totalEvents = await _events.Query().CountAsync();
        var totalActions = await _userActions.Query().CountAsync();
        var todayActions = await _userActions.Query().CountAsync(a => a.CreatedAt >= now.Date);

        var actionsByDay = await _userActions.Query()
            .Where(a => a.CreatedAt >= weekAgo)
            .GroupBy(a => a.CreatedAt.Date)
            .Select(g => new ActionByDayDto { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync();

        var actionsByType = await _userActions.Query()
            .Where(a => a.CreatedAt >= monthAgo)
            .GroupBy(a => a.Action)
            .Select(g => new ActionByTypeDto { Action = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        var topEvents = await _events.Query()
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

        var newUsersLast7Days = await _users.Query()
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
