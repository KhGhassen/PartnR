using Microsoft.EntityFrameworkCore;
using PartnR.Application.DTOs.Chat;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class EventChatService : IEventChatService
{
    private readonly IEventParticipantRepository _participants;
    private readonly IMessageRepository _messages;
    private readonly IUserRepository _users;
    private readonly INotificationRepository _notifications;
    private readonly IUnitOfWork _unitOfWork;

    // Chat was the one action in the product that emitted no Notification, so
    // "je serai en retard de 10 min" reached only the clients connected at
    // that exact second. Push depends on this table too.
    private static readonly TimeSpan NotifyWindow = TimeSpan.FromMinutes(10);

    public EventChatService(
        IEventParticipantRepository participants,
        IMessageRepository messages,
        IUserRepository users,
        INotificationRepository notifications,
        IUnitOfWork unitOfWork)
    {
        _participants = participants;
        _messages = messages;
        _users = users;
        _notifications = notifications;
        _unitOfWork = unitOfWork;
    }

    public async Task EnsureParticipantAsync(Guid eventId, Guid userId)
    {
        var isParticipant = await _participants.Query()
            .AnyAsync(p => p.EventId == eventId && p.UserId == userId && p.Status == ParticipantStatus.Confirmed);

        if (!isParticipant)
            throw new UnauthorizedAccessException("You are not a participant of this event.");
    }

    public async Task<List<ChatMessageDto>> GetHistoryAsync(Guid eventId, int take = 100)
    {
        var messages = await _messages.Query()
            .Include(m => m.User)
            .Where(m => m.EventId == eventId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(take)
            .Select(m => new ChatMessageDto
            {
                Id = m.Id,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                UserId = m.UserId,
                UserName = m.User.FirstName
            })
            .ToListAsync();

        return messages.OrderBy(m => m.CreatedAt).ToList();
    }

    public async Task<ChatMessageDto?> SendMessageAsync(Guid eventId, Guid userId, string content)
    {
        if (string.IsNullOrWhiteSpace(content) || content.Length > 2000) return null;

        // Authorization belongs here, not in the hub: SendMessage is reachable
        // without ever calling JoinEventChat.
        await EnsureParticipantAsync(eventId, userId);

        var user = await _users.FindAsync(userId);
        if (user is null) return null;

        var message = new Message
        {
            EventId = eventId,
            UserId = userId,
            // Stored raw: React and React Native escape on render, so encoding
            // here double-encodes every French apostrophe ("J&#39;arrive").
            Content = content.Trim()
        };

        _messages.Add(message);
        await NotifyOtherParticipantsAsync(eventId, userId, user.FirstName, message.Content);
        await _unitOfWork.SaveChangesAsync();

        return new ChatMessageDto
        {
            Id = message.Id,
            Content = message.Content,
            CreatedAt = message.CreatedAt,
            UserId = userId,
            UserName = user.FirstName
        };
    }

    // One notification per recipient per 10-minute window, keyed on time and
    // not on "an unread one already exists": MarkAllReadAsync re-arms the
    // counter the moment the bell is opened, which would make a busy chat
    // notify on every single message.
    private async Task NotifyOtherParticipantsAsync(Guid eventId, Guid senderId, string senderName, string content)
    {
        var recipients = await _participants.Query()
            .Where(p => p.EventId == eventId && p.UserId != senderId && p.Status == ParticipantStatus.Confirmed)
            .Select(p => p.UserId)
            .ToListAsync();
        if (recipients.Count == 0) return;

        var since = DateTime.UtcNow - NotifyWindow;
        var recentlyNotified = await _notifications.Query()
            .Where(n => n.EventId == eventId && n.Type == "chat_message" && n.CreatedAt >= since && recipients.Contains(n.UserId))
            .Select(n => n.UserId)
            .Distinct()
            .ToListAsync();

        var preview = content.Length > 60 ? content[..57] + "…" : content;
        foreach (var uid in recipients.Except(recentlyNotified))
        {
            _notifications.Add(new Notification
            {
                UserId = uid,
                Type = "chat_message",
                Message = $"{senderName} : {preview}",
                EventId = eventId,
            });
        }
    }
}
