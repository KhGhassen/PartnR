namespace PartnR.Domain.Entities;

public class Activity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;       // "Course à pied"
    public string Slug { get; set; } = string.Empty;       // "running"
    public string Icon { get; set; } = "🏃";               // Emoji
    public string Category { get; set; } = "Sport";       // Groups the picker; see AppDbContext seed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Event> Events { get; set; } = [];
}
