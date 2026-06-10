using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PartnR.Api.Extensions;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/events/{eventId:guid}/[controller]")]
public class RatingsController : ControllerBase
{
    private readonly IRatingService _ratingService;
    private readonly IAnalyticsTracker _tracker;

    public RatingsController(IRatingService ratingService, IAnalyticsTracker tracker)
    {
        _ratingService = ratingService;
        _tracker = tracker;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<RatingDto>> Create(Guid eventId, CreateRatingDto dto)
    {
        var userId = User.GetUserId();
        var rating = await _ratingService.CreateAsync(eventId, userId, dto);
        _tracker.Track(userId, "rating_created", "event", eventId);
        return Created($"api/events/{eventId}/ratings/{rating.Id}", rating);
    }

    [Authorize]
    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<List<RatingDto>>> GetForUser(Guid userId)
    {
        var ratings = await _ratingService.GetForUserAsync(userId);
        return Ok(ratings);
    }
}
