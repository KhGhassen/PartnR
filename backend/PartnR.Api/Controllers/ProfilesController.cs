using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PartnR.Api.Extensions;
using PartnR.Application.DTOs.Profiles;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfilesController : ControllerBase
{
    private readonly IProfileService _profileService;
    private readonly IAnalyticsTracker _tracker;

    public ProfilesController(IProfileService profileService, IAnalyticsTracker tracker)
    {
        _profileService = profileService;
        _tracker = tracker;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProfileDto>> Get(Guid id)
    {
        var profile = await _profileService.GetByIdAsync(id);
        return Ok(profile);
    }

    [HttpGet]
    [EnableRateLimiting("api")]
    public async Task<ActionResult<List<ProfileDto>>> Search([FromQuery] string? city, [FromQuery] string? activity)
    {
        var profiles = await _profileService.SearchAsync(city, activity);
        return Ok(profiles);
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<ActionResult<ProfileDto>> UpdateMe(UpdateProfileDto dto)
    {
        var userId = User.GetUserId();
        var profile = await _profileService.UpdateAsync(userId, dto);
        _tracker.Track(userId, "profile_updated", "user", userId);
        return Ok(profile);
    }
}
