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
    private readonly IUnitOfWork _unitOfWork;

    public EventChatService(
        IEventParticipantRepository participants,
        IMessageRepository messages,
        IUserRepository users,
        IUnitOfWork unitOfWork)
    {
        _participants = participants;
        _messages = messages;
        _users = users;
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

        var user = await _users.FindAsync(userId);
        if (user is null) return null;

        var message = new Message
        {
            EventId = eventId,
            UserId = userId,
            Content = System.Net.WebUtility.HtmlEncode(content.Trim())
        };

        _messages.Add(message);
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
}
