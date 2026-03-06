namespace PartnR.Api.Entities;

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public string UserId { get; set; } = null!;            // FK → AppUser.Id
    public string Content { get; set; } = string.Empty;    // 1-2000 chars
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Event Event { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
