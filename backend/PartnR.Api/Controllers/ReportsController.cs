using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PartnR.Api.Extensions;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reports;

    public ReportsController(IReportService reports)
    {
        _reports = reports;
    }

    [HttpPost]
    [EnableRateLimiting("api")]
    public async Task<IActionResult> Create(CreateReportDto dto)
    {
        var id = await _reports.CreateAsync(User.GetUserId(), dto);
        return Created($"api/reports/{id}", new { id });
    }

    [HttpGet]
    public async Task<ActionResult<List<ReportDto>>> List()
        => Ok(await _reports.ListAsync(User.GetUserId()));

    [HttpPost("{id:guid}/resolve")]
    public async Task<IActionResult> Resolve(Guid id)
    {
        await _reports.ResolveAsync(User.GetUserId(), id);
        return NoContent();
    }
}
