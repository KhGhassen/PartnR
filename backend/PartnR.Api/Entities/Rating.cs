namespace PartnR.Api.Entities;

public class Rating
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public string RaterId { get; set; } = null!;           // Celui qui note
    public string RatedId { get; set; } = null!;           // Celui qui est noté
    public int Score { get; set; }                          // 1-5
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Event Event { get; set; } = null!;
    public AppUser Rater { get; set; } = null!;
    public AppUser Rated { get; set; } = null!;
}
