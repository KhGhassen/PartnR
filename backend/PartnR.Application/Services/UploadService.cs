using Microsoft.EntityFrameworkCore;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class UploadService : IUploadService
{
    public const int MaxImageBytes = 5 * 1024 * 1024;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/gif",
    };

    private readonly IStoredImageRepository _images;
    private readonly IUnitOfWork _unitOfWork;

    public UploadService(IStoredImageRepository images, IUnitOfWork unitOfWork)
    {
        _images = images;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> SaveImageAsync(Guid uploaderId, byte[] data, string contentType)
    {
        if (data.Length == 0)
            throw new ArgumentException("Le fichier est vide.");
        if (data.Length > MaxImageBytes)
            throw new ArgumentException("L'image ne doit pas dépasser 5 Mo.");
        if (!AllowedContentTypes.Contains(contentType))
            throw new ArgumentException("Format non supporté. Utilisez JPEG, PNG, WebP ou GIF.");

        var image = new StoredImage
        {
            UploaderId = uploaderId,
            Data = data,
            ContentType = contentType,
        };
        _images.Add(image);
        await _unitOfWork.SaveChangesAsync();
        return image.Id;
    }

    public async Task<StoredImageResult?> GetImageAsync(Guid id)
    {
        var image = await _images.Query().AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        return image is null ? null : new StoredImageResult(image.Data, image.ContentType);
    }
}
