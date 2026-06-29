using Microsoft.AspNetCore.Mvc;
using PartnR.Domain.Constants;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CitiesController : ControllerBase
{
    [HttpGet]
    public IActionResult List() => Ok(FrenchCities.All);
}
