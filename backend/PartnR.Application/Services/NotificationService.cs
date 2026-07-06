using Microsoft.EntityFrameworkCore;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notifications;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(INotificationRepository notifications, IUnitOfWork unitOfWork)
    {
        _notifications = notifications;
        _unitOfWork = unitOfWork;
    }

    public async Task<NotificationListDto> ListAsync(Guid userId, int take = 20)
    {
        take = Math.Clamp(take, 1, 50);
        var items = await _notifications.Query()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .Select(n => new NotificationDto(n.Id, n.Type, n.Message, n.EventId, n.IsRead, n.CreatedAt))
            .ToListAsync();

        var unread = await _notifications.Query().CountAsync(n => n.UserId == userId && !n.IsRead);
        return new NotificationListDto(items, unread);
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        var unread = await _notifications.Query()
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();
        foreach (var n in unread) n.IsRead = true;
        await _unitOfWork.SaveChangesAsync();
    }
}
