using Microsoft.EntityFrameworkCore;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class EventCommentService : IEventCommentService
{
    private readonly IEventRepository _events;
    private readonly IEventCommentRepository _comments;
    private readonly IUserRepository _users;
    private readonly INotificationRepository _notifications;
    private readonly IUnitOfWork _unitOfWork;

    public EventCommentService(
        IEventRepository events,
        IEventCommentRepository comments,
        IUserRepository users,
        INotificationRepository notifications,
        IUnitOfWork unitOfWork)
    {
        _events = events;
        _comments = comments;
        _users = users;
        _notifications = notifications;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<EventCommentDto>> ListAsync(Guid eventId)
    {
        var ev = await _events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        return await _comments.Query()
            .Where(c => c.EventId == eventId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new EventCommentDto
            {
                Id = c.Id,
                EventId = c.EventId,
                UserId = c.UserId,
                UserName = c.User.FirstName,
                UserAvatarUrl = c.User.AvatarUrl,
                IsOrganizer = c.UserId == ev.CreatorId,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
            })
            .ToListAsync();
    }

    public async Task<EventCommentDto> AddAsync(Guid eventId, Guid userId, AddEventCommentDto dto)
    {
        var ev = await _events.Query()
            .Include(e => e.Creator)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        var comment = new EventComment
        {
            EventId = eventId,
            UserId = userId,
            Content = dto.Content.Trim(),
        };
        _comments.Add(comment);

        if (ev.CreatorId != userId)
        {
            _notifications.Add(new Notification
            {
                UserId = ev.CreatorId,
                Type = "event_question",
                Message = $"Nouvelle question sur « {ev.Title} ».",
                EventId = ev.Id,
            });
        }

        await _unitOfWork.SaveChangesAsync();

        var author = await _users.FindAsync(userId);

        return new EventCommentDto
        {
            Id = comment.Id,
            EventId = comment.EventId,
            UserId = comment.UserId,
            UserName = author?.FirstName ?? string.Empty,
            UserAvatarUrl = author?.AvatarUrl,
            IsOrganizer = comment.UserId == ev.CreatorId,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
        };
    }

    public async Task DeleteAsync(Guid eventId, Guid commentId, Guid userId)
    {
        var ev = await _events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        var comment = await _comments.Query()
            .FirstOrDefaultAsync(c => c.Id == commentId && c.EventId == eventId)
            ?? throw new KeyNotFoundException("Comment not found.");

        if (comment.UserId != userId && ev.CreatorId != userId)
            throw new UnauthorizedAccessException("Only the author or the organizer can delete this comment.");

        _comments.Remove(comment);
        await _unitOfWork.SaveChangesAsync();
    }
}
