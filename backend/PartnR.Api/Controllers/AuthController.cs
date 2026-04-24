using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PartnR.Api.DTOs.Auth;
using PartnR.Api.Entities;
using PartnR.Api.Extensions;
using PartnR.Api.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly UserManager<AppUser> _userManager;
    private readonly AnalyticsTracker _tracker;

    public AuthController(AuthService authService, UserManager<AppUser> userManager, AnalyticsTracker tracker)
    {
        _authService = authService;
        _userManager = userManager;
        _tracker = tracker;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        var response = await _authService.RegisterAsync(dto);
        _tracker.Track(response.User.Id, "user_registered", "user", response.User.Id);
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var response = await _authService.LoginAsync(dto);
        _tracker.Track(response.User.Id, "user_login", "user", response.User.Id);
        return Ok(response);
    }

    [Authorize]
    [DisableRateLimiting]
    [HttpGet("me")]
    public async Task<ActionResult<UserInfoDto>> Me()
    {
        var userId = User.GetUserId();
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null) return NotFound();

        return Ok(new UserInfoDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            Email = user.Email!,
            AvatarUrl = user.AvatarUrl,
            City = user.City,
            Role = user.Role
        });
    }
}
