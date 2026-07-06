using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PartnR.Api.Extensions;
using PartnR.Application.Interfaces.Services;
using PartnR.Application.Services;

namespace PartnR.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private readonly IUploadService _uploadService;

    public UploadsController(IUploadService uploadService)
    {
        _uploadService = uploadService;
    }

    [Authorize]
    [HttpPost]
    [EnableRateLimiting("api")]
    [RequestSizeLimit(UploadService.MaxImageBytes + 1024)]
    public async Task<IActionResult> Upload(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            throw new ArgumentException("Aucun fichier reçu.");

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        var id = await _uploadService.SaveImageAsync(User.GetUserId(), ms.ToArray(), file.ContentType);
        var url = $"{Request.Scheme}://{Request.Host}/api/uploads/{id}";
        return Created(url, new { id, url });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var image = await _uploadService.GetImageAsync(id);
        if (image is null) return NotFound();

        Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        return File(image.Data, image.ContentType);
    }
}
