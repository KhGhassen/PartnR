using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PartnR.Api.Extensions;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/events/{eventId:guid}/photos")]
public class EventPhotosController : ControllerBase
{
    private readonly IEventPhotoService _photoService;
    private readonly IAnalyticsTracker _tracker;

    public EventPhotosController(IEventPhotoService photoService, IAnalyticsTracker tracker)
    {
        _photoService = photoService;
        _tracker = tracker;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<EventPhotoDto>> Add(Guid eventId, AddEventPhotoDto dto)
    {
        var userId = User.GetUserId();
        var photo = await _photoService.AddAsync(eventId, userId, dto);
        _tracker.Track(userId, "event_photo_added", "event", eventId);
        return Created($"api/events/{eventId}/photos/{photo.Id}", photo);
    }

    [Authorize]
    [HttpDelete("{photoId:guid}")]
    public async Task<IActionResult> Delete(Guid eventId, Guid photoId)
    {
        var userId = User.GetUserId();
        await _photoService.DeleteAsync(eventId, photoId, userId);
        _tracker.Track(userId, "event_photo_deleted", "event", eventId);
        return NoContent();
    }
}
