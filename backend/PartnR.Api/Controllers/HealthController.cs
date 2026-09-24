using Microsoft.AspNetCore.Mvc;

namespace PartnR.Api.Controllers;

// Liveness only — deliberately no database round-trip. Two consumers:
// the clients' wake-up gate (Render free tier cold-starts for ~30 s, and
// this is the cheapest request that proves the process is up), and any
// external keep-alive pinger. A DB check here would make a Supabase hiccup
// look like a dead API.
[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok" });
}
