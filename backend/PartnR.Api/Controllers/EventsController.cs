using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PartnR.Api.DTOs.Events;
using PartnR.Api.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly EventService _eventService;

    public EventsController(EventService eventService) => _eventService = eventService;

    [HttpGet]
    public async Task<ActionResult<List<EventDto>>> List(
        [FromQuery] string? city,
        [FromQuery] Guid? activityId,
        [FromQuery] string? status)
    {
        var events = await _eventService.ListAsync(city, activityId, status);
        return Ok(events);
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
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ev = await _eventService.CreateAsync(userId, dto);
        return CreatedAtAction(nameof(Get), new { id = ev.Id }, ev);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EventDetailDto>> Update(Guid id, UpdateEventDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ev = await _eventService.UpdateAsync(id, userId, dto);
        return Ok(ev);
    }

    [Authorize]
    [HttpPost("{id:guid}/join")]
    public async Task<IActionResult> Join(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _eventService.JoinAsync(id, userId);
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:guid}/leave")]
    public async Task<IActionResult> Leave(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _eventService.LeaveAsync(id, userId);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _eventService.DeleteAsync(id, userId);
        return NoContent();
    }
}
