using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PartnR.Api.DTOs;
using PartnR.Api.DTOs.Admin;
using PartnR.Api.Entities;
using PartnR.Api.Extensions;
using PartnR.Api.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly AdminService _adminService;
    private readonly UserManager<AppUser> _userManager;
    private readonly AnalyticsTracker _tracker;

    public AdminController(AdminService adminService, UserManager<AppUser> userManager, AnalyticsTracker tracker)
    {
        _adminService = adminService;
        _userManager = userManager;
        _tracker = tracker;
    }

    [HttpGet("users")]
    public async Task<ActionResult<PaginatedResult<AdminUserDto>>> ListUsers(
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!await IsAdminAsync()) return Forbid();

        var users = await _adminService.ListUsersAsync(search, page, pageSize);
        return Ok(users);
    }

    [HttpPost("users/{id:guid}/ban")]
    public async Task<ActionResult<AdminUserDto>> BanUser(Guid id)
    {
        if (!await IsAdminAsync()) return Forbid();

        var user = await _adminService.SetBannedAsync(id, true);
        _tracker.Track(User.GetUserId(), "user_banned", "user", id);
        return Ok(user);
    }

    [HttpPost("users/{id:guid}/unban")]
    public async Task<ActionResult<AdminUserDto>> UnbanUser(Guid id)
    {
        if (!await IsAdminAsync()) return Forbid();

        var user = await _adminService.SetBannedAsync(id, false);
        _tracker.Track(User.GetUserId(), "user_unbanned", "user", id);
        return Ok(user);
    }

    private async Task<bool> IsAdminAsync()
    {
        var appUser = await _userManager.FindByIdAsync(User.GetUserId().ToString());
        return appUser is not null && appUser.Role == "admin";
    }
}
