namespace PartnR.Application.Interfaces.Services;

public record NotificationDto(Guid Id, string Type, string Message, Guid? EventId, bool IsRead, DateTime CreatedAt);

public record NotificationListDto(List<NotificationDto> Items, int UnreadCount);

public interface INotificationService
{
    Task<NotificationListDto> ListAsync(Guid userId, int take = 20);
    Task MarkAllReadAsync(Guid userId);
}
