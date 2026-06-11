using Microsoft.AspNetCore.Mvc;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;

    public ActivitiesController(IActivityService activityService) => _activityService = activityService;

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var activities = await _activityService.ListAsync();
        return Ok(activities);
    }
}
