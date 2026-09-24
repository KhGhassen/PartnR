namespace PartnR.Application.Interfaces.Services;

public record StoredImageResult(byte[] Data, string ContentType);

public interface IUploadService
{
    /// <summary>Stores an image. The content type is derived from the bytes, not trusted from the client.</summary>
    Task<Guid> SaveImageAsync(Guid uploaderId, byte[] data);
    Task<StoredImageResult?> GetImageAsync(Guid id);
}
