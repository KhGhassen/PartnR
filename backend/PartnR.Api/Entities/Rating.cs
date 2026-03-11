namespace PartnR.Api.Entities;

public class Rating
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public Guid RaterId { get; set; }
    public Guid RatedUserId { get; set; }
    public int Score { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Event Event { get; set; } = null!;
    public AppUser Rater { get; set; } = null!;
    public AppUser Rated { get; set; } = null!;
}
