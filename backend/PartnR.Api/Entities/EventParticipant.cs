namespace PartnR.Api.Entities;

public enum ParticipantStatus
{
    Confirmed,
    Cancelled
}

public class EventParticipant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public string UserId { get; set; } = null!;            // FK → AppUser.Id
    public ParticipantStatus Status { get; set; } = ParticipantStatus.Confirmed;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Event Event { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
