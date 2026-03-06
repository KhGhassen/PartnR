namespace PartnR.Api.DTOs.Events;

public class EventDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string City { get; set; } = null!;
    public string? Location { get; set; }
    public DateTime Date { get; set; }
    public int MaxParticipants { get; set; }
    public string Status { get; set; } = null!;
    public string ActivityName { get; set; } = null!;
    public string ActivityIcon { get; set; } = null!;
    public Guid CreatorId { get; set; }
    public string CreatorName { get; set; } = null!;
    public int ParticipantCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EventDetailDto : EventDto
{
    public List<ParticipantDto> Participants { get; set; } = [];
}

public class ParticipantDto
{
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public string Status { get; set; } = null!;
    public DateTime JoinedAt { get; set; }
}

public class CreateEventDto
{
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string City { get; set; } = null!;
    public string? Location { get; set; }
    public DateTime Date { get; set; }
    public int MaxParticipants { get; set; } = 2;
    public Guid ActivityId { get; set; }
}

public class UpdateEventDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? City { get; set; }
    public string? Location { get; set; }
    public DateTime? Date { get; set; }
    public int? MaxParticipants { get; set; }
    public string? Status { get; set; }
}
