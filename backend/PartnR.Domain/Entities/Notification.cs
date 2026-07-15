namespace PartnR.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? EventId { get; set; }
    public bool IsRead { get; set; }
    public bool PushSent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
