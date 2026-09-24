using Microsoft.EntityFrameworkCore;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class UploadService : IUploadService
{
    public const int MaxImageBytes = 5 * 1024 * 1024;

    // The multipart Content-Type header is set by the client and is trivially
    // forged; the stored value used to be re-served verbatim with a one-year
    // cache, turning the endpoint into an arbitrary-file host on a trusted
    // domain. Only the bytes are believed.
    public static string? DetectImageType(ReadOnlySpan<byte> d)
    {
        if (d.Length >= 3 && d[0] == 0xFF && d[1] == 0xD8 && d[2] == 0xFF) return "image/jpeg";
        if (d.Length >= 8 && d[0] == 0x89 && d[1] == 0x50 && d[2] == 0x4E && d[3] == 0x47
            && d[4] == 0x0D && d[5] == 0x0A && d[6] == 0x1A && d[7] == 0x0A) return "image/png";
        if (d.Length >= 6 && d[0] == 'G' && d[1] == 'I' && d[2] == 'F' && d[3] == '8'
            && (d[4] == '7' || d[4] == '9') && d[5] == 'a') return "image/gif";
        if (d.Length >= 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
            && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') return "image/webp";
        return null;
    }

    private readonly IStoredImageRepository _images;
    private readonly IUnitOfWork _unitOfWork;

    public UploadService(IStoredImageRepository images, IUnitOfWork unitOfWork)
    {
        _images = images;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> SaveImageAsync(Guid uploaderId, byte[] data)
    {
        if (data.Length == 0)
            throw new ArgumentException("Le fichier est vide.");
        if (data.Length > MaxImageBytes)
            throw new ArgumentException("L'image ne doit pas dépasser 5 Mo.");
        var contentType = DetectImageType(data)
            ?? throw new ArgumentException("Format non supporté. Utilisez JPEG, PNG, WebP ou GIF.");

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
