using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PartnR.Api.Data;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ActivitiesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var activities = await _db.Activities
            .OrderBy(a => a.Name)
            .Select(a => new { a.Id, a.Name, a.Slug, a.Icon })
            .ToListAsync();
        return Ok(activities);
    }
}
