using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PartnR.Api.Extensions;
using PartnR.Application.DTOs.Auth;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IAnalyticsTracker _tracker;

    public AuthController(IAuthService authService, IAnalyticsTracker tracker)
    {
        _authService = authService;
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
        var user = await _authService.GetCurrentUserAsync(User.GetUserId());
        return Ok(user);
    }

    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(ConfirmEmailDto dto)
    {
        await _authService.ConfirmEmailAsync(dto.UserId, dto.Token);
        return Ok(new { message = "Email confirmé avec succès." });
    }

    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation(ResendConfirmationDto dto)
    {
        await _authService.ResendConfirmationAsync(dto.Email);
        return Ok(new { message = "Si ce compte existe et n'est pas encore vérifié, un email a été envoyé." });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        await _authService.ForgotPasswordAsync(dto.Email);
        return Ok(new { message = "Si ce compte existe, un email de réinitialisation a été envoyé." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        await _authService.ResetPasswordAsync(dto.Email, dto.Token, dto.NewPassword);
        return Ok(new { message = "Mot de passe réinitialisé avec succès." });
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        await _authService.ChangePasswordAsync(User.GetUserId(), dto.CurrentPassword, dto.NewPassword);
        return Ok(new { message = "Mot de passe modifié avec succès." });
    }
}
