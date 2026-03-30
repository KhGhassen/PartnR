using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PartnR.Api.Data;
using PartnR.Api.Entities;
using PartnR.Api.Extensions;

namespace PartnR.Api.Hubs;

[Authorize]
public class EventChatHub : Hub
{
    private readonly AppDbContext _db;

    public EventChatHub(AppDbContext db) => _db = db;

    public async Task JoinEventChat(string eventId)
    {
        var userId = Context.User!.GetUserId();
        var eid = Guid.Parse(eventId);

        var isParticipant = await _db.EventParticipants
            .AnyAsync(p => p.EventId == eid && p.UserId == userId && p.Status == ParticipantStatus.Confirmed);

        if (!isParticipant)
            throw new HubException("You are not a participant of this event.");

        await Groups.AddToGroupAsync(Context.ConnectionId, eventId);

        var messages = (await _db.Messages
            .Include(m => m.User)
            .Where(m => m.EventId == eid)
            .OrderByDescending(m => m.CreatedAt)
            .Take(100)
            .Select(m => new
            {
                m.Id,
                m.Content,
                m.CreatedAt,
                UserId = m.UserId,
                UserName = m.User.FirstName
            })
            .ToListAsync())
            .OrderBy(m => m.CreatedAt)
            .ToList();

        await Clients.Caller.SendAsync("MessageHistory", messages);
    }

    public async Task SendMessage(string eventId, string content)
    {
        if (string.IsNullOrWhiteSpace(content) || content.Length > 2000) return;

        var userId = Context.User!.GetUserId();
        var eid = Guid.Parse(eventId);

        var user = await _db.Users.FindAsync(userId);
        if (user is null) return;

        var message = new Message
        {
            EventId = eid,
            UserId = userId,
            Content = System.Net.WebUtility.HtmlEncode(content.Trim())
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        await Clients.Group(eventId).SendAsync("NewMessage", new
        {
            message.Id,
            message.Content,
            message.CreatedAt,
            UserId = userId,
            UserName = user.FirstName
        });
    }

    public async Task LeaveEventChat(string eventId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, eventId);
    }
}
