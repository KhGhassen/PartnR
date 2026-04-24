using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PartnR.Api.DTOs.Analytics;
using PartnR.Api.Extensions;
using PartnR.Api.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly AnalyticsTracker _tracker;
    private readonly AnalyticsService _analyticsService;

    public AnalyticsController(AnalyticsTracker tracker, AnalyticsService analyticsService)
    {
        _tracker = tracker;
        _analyticsService = analyticsService;
    }

    [Authorize]
    [HttpPost("track")]
    public IActionResult Track(TrackActionDto dto)
    {
        var userId = User.GetUserId();
        _tracker.Track(userId, dto.Action, dto.EntityType, dto.EntityId, dto.Metadata);
        return NoContent();
    }

    [Authorize]
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardDto>> Dashboard()
    {
        var userId = User.GetUserId();
        var user = HttpContext.RequestServices
            .GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<Entities.AppUser>>();
        var appUser = await user.FindByIdAsync(userId.ToString());
        if (appUser is null || appUser.Role != "admin")
            return Forbid();

        var dashboard = await _analyticsService.GetDashboardAsync();
        return Ok(dashboard);
    }
}
