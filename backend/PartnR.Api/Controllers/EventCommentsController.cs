using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PartnR.Api.Extensions;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/events/{eventId:guid}/comments")]
public class EventCommentsController : ControllerBase
{
    private readonly IEventCommentService _commentService;
    private readonly IAnalyticsTracker _tracker;

    public EventCommentsController(IEventCommentService commentService, IAnalyticsTracker tracker)
    {
        _commentService = commentService;
        _tracker = tracker;
    }

    [HttpGet]
    [EnableRateLimiting("api")]
    public async Task<ActionResult<List<EventCommentDto>>> List(Guid eventId)
        => Ok(await _commentService.ListAsync(eventId));

    [Authorize]
    [HttpPost]
    [EnableRateLimiting("api")]
    public async Task<ActionResult<EventCommentDto>> Add(Guid eventId, AddEventCommentDto dto)
    {
        var userId = User.GetUserId();
        var comment = await _commentService.AddAsync(eventId, userId, dto);
        _tracker.Track(userId, "event_comment_added", "event", eventId);
        return Created($"api/events/{eventId}/comments/{comment.Id}", comment);
    }

    [Authorize]
    [HttpDelete("{commentId:guid}")]
    public async Task<IActionResult> Delete(Guid eventId, Guid commentId)
    {
        await _commentService.DeleteAsync(eventId, commentId, User.GetUserId());
        return NoContent();
    }
}
