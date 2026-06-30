namespace PartnR.Domain.Entities;

public class EventPhoto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public Guid UploaderId { get; set; }
    public string Url { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Event Event { get; set; } = null!;
    public AppUser Uploader { get; set; } = null!;
}
