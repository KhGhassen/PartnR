namespace PartnR.Domain.Entities;

public enum ParticipantStatus
{
    Confirmed,
    Cancelled,
    Waitlisted
}

public class EventParticipant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public ParticipantStatus Status { get; set; } = ParticipantStatus.Confirmed;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    // Per participant, not per event: whoever joins after the reminder pass
    // still gets one, and a rescheduled event re-arms it by nulling this.
    public DateTime? ReminderSentAt { get; set; }

    // Navigation
    public Event Event { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
