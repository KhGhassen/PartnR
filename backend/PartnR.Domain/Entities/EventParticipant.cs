namespace PartnR.Domain.Entities;

public enum ParticipantStatus
{
    Confirmed,
    Cancelled,
    Waitlisted
}

// Marked by the organiser once the outing has happened. Unknown is the
// default and the only value a participant can hold before the date.
public enum AttendanceStatus
{
    Unknown,
    Present,
    Absent
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
    public AttendanceStatus Attendance { get; set; } = AttendanceStatus.Unknown;

    // Navigation
    public Event Event { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
