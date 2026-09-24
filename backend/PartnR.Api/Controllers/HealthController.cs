using Microsoft.AspNetCore.Mvc;
using PartnR.Infrastructure.Data;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db) => _db = db;

    // Liveness only — deliberately no database round-trip. Two consumers:
    // the clients' wake-up gate (Render free tier cold-starts for ~30 s, and
    // this is the cheapest request that proves the process is up), and the
    // external keep-alive pinger. A DB check here would make a Supabase
    // hiccup look like a dead API.
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok" });

    // Readiness: the process AND its database. For alerting, not for
    // keep-alive — 503 here means "users are seeing errors right now".
    [HttpGet("ready")]
    public async Task<IActionResult> Ready(CancellationToken ct)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(5));
        try
        {
            if (await _db.Database.CanConnectAsync(timeout.Token))
                return Ok(new { status = "ok", database = "ok" });
        }
        catch (Exception)
        {
            // fall through
        }
        return StatusCode(503, new { status = "degraded", database = "unreachable" });
    }
}
