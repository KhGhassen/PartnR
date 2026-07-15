using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PartnR.Api.Extensions;
using PartnR.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notifications;
    private readonly AppDbContext _db;

    public NotificationsController(INotificationService notifications, AppDbContext db)
    {
        _notifications = notifications;
        _db = db;
    }

    public record PushTokenDto(string Token);

    [HttpGet]
    [EnableRateLimiting("api")]
    public async Task<ActionResult<NotificationListDto>> List([FromQuery] int take = 20)
        => Ok(await _notifications.ListAsync(User.GetUserId(), take));

    [HttpPost("push-token")]
    public async Task<IActionResult> RegisterPushToken(PushTokenDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token) || dto.Token.Length > 200)
            throw new ArgumentException("Token invalide.");

        var userId = User.GetUserId();
        var existing = await _db.PushTokens.FirstOrDefaultAsync(t => t.Token == dto.Token);
        if (existing is null)
            _db.PushTokens.Add(new PushToken { UserId = userId, Token = dto.Token });
        else
            existing.UserId = userId; // token moved to another account on this device
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _notifications.MarkAllReadAsync(User.GetUserId());
        return NoContent();
    }
}
