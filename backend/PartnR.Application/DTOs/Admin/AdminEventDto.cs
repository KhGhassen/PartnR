namespace PartnR.Application.DTOs.Admin;

public class AdminEventDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string City { get; set; } = null!;
    public DateTime Date { get; set; }
    public int MaxParticipants { get; set; }
    public string Status { get; set; } = null!;
    public string ActivityName { get; set; } = null!;
    public Guid CreatorId { get; set; }
    public string CreatorName { get; set; } = null!;
    public int ParticipantCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
