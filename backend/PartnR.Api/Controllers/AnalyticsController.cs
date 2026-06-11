using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PartnR.Api.Extensions;
using PartnR.Application.DTOs.Analytics;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsTracker _tracker;
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsTracker tracker, IAnalyticsService analyticsService)
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
        var dashboard = await _analyticsService.GetDashboardAsync(User.GetUserId());
        return Ok(dashboard);
    }
}
