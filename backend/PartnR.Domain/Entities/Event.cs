namespace PartnR.Domain.Entities;

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
    public Guid CreatorId { get; set; }
    public Guid ActivityId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int MaxParticipants { get; set; }
    public EventStatus Status { get; set; } = EventStatus.Published;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public AppUser Creator { get; set; } = null!;
    public Activity Activity { get; set; } = null!;
    public ICollection<EventParticipant> Participants { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
    public ICollection<Rating> Ratings { get; set; } = [];
}
