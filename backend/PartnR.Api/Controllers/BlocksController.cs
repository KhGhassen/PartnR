using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PartnR.Api.Extensions;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BlocksController : ControllerBase
{
    private readonly IBlockService _blocks;

    public BlocksController(IBlockService blocks)
    {
        _blocks = blocks;
    }

    [HttpGet]
    public async Task<ActionResult<List<BlockedUserDto>>> List()
        => Ok(await _blocks.ListAsync(User.GetUserId()));

    [HttpPost("{userId:guid}")]
    [EnableRateLimiting("api")]
    public async Task<IActionResult> Block(Guid userId)
    {
        await _blocks.BlockAsync(User.GetUserId(), userId);
        return NoContent();
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Unblock(Guid userId)
    {
        await _blocks.UnblockAsync(User.GetUserId(), userId);
        return NoContent();
    }
}
