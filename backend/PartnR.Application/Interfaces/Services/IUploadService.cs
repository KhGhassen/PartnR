namespace PartnR.Application.Interfaces.Services;

public record StoredImageResult(byte[] Data, string ContentType);

public interface IUploadService
{
    Task<Guid> SaveImageAsync(Guid uploaderId, byte[] data, string contentType);
    Task<StoredImageResult?> GetImageAsync(Guid id);
}
