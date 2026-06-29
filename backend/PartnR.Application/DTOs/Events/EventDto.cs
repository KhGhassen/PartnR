using System.ComponentModel.DataAnnotations;
using PartnR.Application.Validation;
using PartnR.Domain.Entities;

namespace PartnR.Application.DTOs.Events;

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
    [Required, MinLength(3), MaxLength(100)]
    public string Title { get; set; } = null!;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required, MaxLength(100), AllowedCity]
    public string City { get; set; } = null!;

    [MaxLength(200)]
    public string? Location { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Range(2, 50)]
    public int MaxParticipants { get; set; } = 2;

    [Required]
    public Guid ActivityId { get; set; }
}

public class UpdateEventDto
{
    [MinLength(3), MaxLength(100)]
    public string? Title { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(100), AllowedCity]
    public string? City { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    public DateTime? Date { get; set; }

    [Range(2, 50)]
    public int? MaxParticipants { get; set; }

    public EventStatus? Status { get; set; }
}
