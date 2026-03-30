using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PartnR.Api.DTOs.Profiles;
using PartnR.Api.Extensions;
using PartnR.Api.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfilesController : ControllerBase
{
    private readonly ProfileService _profileService;

    public ProfilesController(ProfileService profileService) => _profileService = profileService;

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
        return Ok(profile);
    }
}
