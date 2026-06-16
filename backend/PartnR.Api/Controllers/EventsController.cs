using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using PartnR.Api.Extensions;
using PartnR.Api.Hubs;
using PartnR.Application.DTOs;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly IAnalyticsTracker _tracker;
    private readonly IHubContext<EventChatHub> _hubContext;

    public EventsController(IEventService eventService, IAnalyticsTracker tracker, IHubContext<EventChatHub> hubContext)
    {
        _eventService = eventService;
        _tracker = tracker;
        _hubContext = hubContext;
    }

    [HttpGet]
    [EnableRateLimiting("api")]
    public async Task<ActionResult<PaginatedResult<EventDto>>> List(
        [FromQuery] string? city,
        [FromQuery] Guid? activityId,
        [FromQuery] EventStatus? status,
        [FromQuery] bool mine = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        Guid? userId = mine && User.Identity?.IsAuthenticated == true ? User.GetUserId() : null;
        var result = await _eventService.ListAsync(city, activityId, status, page, pageSize, mine, userId);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventDetailDto>> Get(Guid id)
    {
        var ev = await _eventService.GetByIdAsync(id);
        return Ok(ev);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<EventDetailDto>> Create(CreateEventDto dto)
    {
        var userId = User.GetUserId();
        var ev = await _eventService.CreateAsync(userId, dto);
        _tracker.Track(userId, "event_created", "event", ev.Id);
        return CreatedAtAction(nameof(Get), new { id = ev.Id }, ev);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EventDetailDto>> Update(Guid id, UpdateEventDto dto)
    {
        var userId = User.GetUserId();
        var ev = await _eventService.UpdateAsync(id, userId, dto);
        _tracker.Track(userId, "event_updated", "event", id);
        return Ok(ev);
    }

    [Authorize]
    [HttpPost("{id:guid}/join")]
    public async Task<IActionResult> Join(Guid id)
    {
        var userId = User.GetUserId();
        var firstName = User.FindFirstValue(ClaimTypes.Name) ?? "Quelqu'un";
        await _eventService.JoinAsync(id, userId);
        _tracker.Track(userId, "event_joined", "event", id);
        await _hubContext.Clients.Group(id.ToString())
            .SendAsync("ParticipantJoined", new { userId, firstName });
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:guid}/leave")]
    public async Task<IActionResult> Leave(Guid id)
    {
        var userId = User.GetUserId();
        var firstName = User.FindFirstValue(ClaimTypes.Name) ?? "Quelqu'un";
        await _eventService.LeaveAsync(id, userId);
        _tracker.Track(userId, "event_left", "event", id);
        await _hubContext.Clients.Group(id.ToString())
            .SendAsync("ParticipantLeft", new { userId, firstName });
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        await _eventService.DeleteAsync(id, userId);
        _tracker.Track(userId, "event_deleted", "event", id);
        return NoContent();
    }
}
