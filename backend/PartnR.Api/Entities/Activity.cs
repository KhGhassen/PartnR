namespace PartnR.Api.Entities;

public class Activity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;       // "Running"
    public string Slug { get; set; } = string.Empty;       // "running"
    public string Icon { get; set; } = "🏃";               // Emoji
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Event> Events { get; set; } = [];
}
