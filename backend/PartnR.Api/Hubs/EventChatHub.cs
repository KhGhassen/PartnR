using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using PartnR.Api.Extensions;
using PartnR.Application.DTOs.Chat;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Hubs;

[Authorize]
public class EventChatHub : Hub
{
    private readonly IEventChatService _chatService;
    private readonly IAnalyticsTracker _tracker;

    public EventChatHub(IEventChatService chatService, IAnalyticsTracker tracker)
    {
        _chatService = chatService;
        _tracker = tracker;
    }

    // ExceptionMiddleware is HTTP-only, so hub methods translate their own
    // failures into HubException — anything else reaches the client as an
    // opaque "an unexpected error occurred".
    private static Guid ParseEventId(string eventId) =>
        Guid.TryParse(eventId, out var eid) ? eid : throw new HubException("Identifiant d'événement invalide.");

    public async Task JoinEventChat(string eventId)
    {
        var userId = Context.User!.GetUserId();
        var eid = ParseEventId(eventId);

        try
        {
            await _chatService.EnsureParticipantAsync(eid, userId);
        }
        catch (UnauthorizedAccessException ex)
        {
            throw new HubException(ex.Message);
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, eventId);

        var messages = await _chatService.GetHistoryAsync(eid, userId);
        await Clients.Caller.SendAsync("MessageHistory", messages);
    }

    public async Task SendMessage(string eventId, string content)
    {
        var userId = Context.User!.GetUserId();
        var eid = ParseEventId(eventId);

        ChatMessageDto? message;
        try
        {
            message = await _chatService.SendMessageAsync(eid, userId, content);
        }
        catch (UnauthorizedAccessException ex)
        {
            throw new HubException(ex.Message);
        }
        if (message is null) return;

        _tracker.Track(userId, "message_sent", "event", eid);

        await Clients.Group(eventId).SendAsync("NewMessage", message);
    }

    public async Task LeaveEventChat(string eventId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, eventId);
    }
}
