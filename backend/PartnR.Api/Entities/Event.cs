namespace PartnR.Api.Entities;

public enum EventStatus
{
    Draft,
    Published,
    Cancelled,
    Completed
}

public class Event
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CreatedById { get; set; } = null!;       // FK → AppUser.Id (string car IdentityUser)
    public Guid ActivityId { get; set; }
    public string Title { get; set; } = string.Empty;      // 3-100 chars
    public string Description { get; set; } = string.Empty; // max 1000
    public string City { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;   // Adresse ou point de RDV
    public DateTime Date { get; set; }
    public int MaxParticipants { get; set; }                // 2-50
    public EventStatus Status { get; set; } = EventStatus.Published;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public AppUser CreatedBy { get; set; } = null!;
    public Activity Activity { get; set; } = null!;
    public ICollection<EventParticipant> Participants { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
    public ICollection<Rating> Ratings { get; set; } = [];
}
