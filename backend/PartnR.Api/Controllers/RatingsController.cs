using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PartnR.Api.DTOs.Events;
using PartnR.Api.Extensions;
using PartnR.Api.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/events/{eventId:guid}/[controller]")]
public class RatingsController : ControllerBase
{
    private readonly RatingService _ratingService;

    public RatingsController(RatingService ratingService) => _ratingService = ratingService;

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<RatingDto>> Create(Guid eventId, CreateRatingDto dto)
    {
        var userId = User.GetUserId();
        var rating = await _ratingService.CreateAsync(eventId, userId, dto);
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
