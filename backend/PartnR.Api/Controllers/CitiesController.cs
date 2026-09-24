using Microsoft.AspNetCore.Mvc;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CitiesController : ControllerBase
{
    private readonly ICityService _cities;

    public CitiesController(ICityService cities) => _cities = cities;

    [HttpGet]
    public async Task<ActionResult<List<string>>> List() => Ok(await _cities.ListAsync());
}
