using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PartnR.Api.Extensions;
using PartnR.Application.DTOs;
using PartnR.Application.DTOs.Admin;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IAnalyticsTracker _tracker;

    public AdminController(IAdminService adminService, IAnalyticsTracker tracker)
    {
        _adminService = adminService;
        _tracker = tracker;
    }

    [HttpGet("users")]
    public async Task<ActionResult<PaginatedResult<AdminUserDto>>> ListUsers(
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var users = await _adminService.ListUsersAsync(User.GetUserId(), search, page, pageSize);
        return Ok(users);
    }

    [HttpPost("users/{id:guid}/ban")]
    public async Task<ActionResult<AdminUserDto>> BanUser(Guid id)
    {
        var user = await _adminService.BanUserAsync(User.GetUserId(), id);
        _tracker.Track(User.GetUserId(), "user_banned", "user", id);
        return Ok(user);
    }

    [HttpPost("users/{id:guid}/unban")]
    public async Task<ActionResult<AdminUserDto>> UnbanUser(Guid id)
    {
        var user = await _adminService.UnbanUserAsync(User.GetUserId(), id);
        _tracker.Track(User.GetUserId(), "user_unbanned", "user", id);
        return Ok(user);
    }
}
