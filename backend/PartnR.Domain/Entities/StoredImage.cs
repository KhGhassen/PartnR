namespace PartnR.Domain.Entities;

public class StoredImage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UploaderId { get; set; }
    public byte[] Data { get; set; } = [];
    public string ContentType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
