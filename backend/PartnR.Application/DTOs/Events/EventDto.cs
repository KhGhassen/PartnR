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
    public string? PhotoUrl { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? DistanceKm { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EventDetailDto : EventDto
{
    public List<ParticipantDto> Participants { get; set; } = [];
    public List<EventPhotoDto> Photos { get; set; } = [];
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

    // When set (2-12), creates that many weekly occurrences of the event.
    [Range(2, 12)]
    public int? RecurrenceWeeks { get; set; }

    [Required]
    public Guid ActivityId { get; set; }

    [MaxLength(500)]
    public string? PhotoUrl { get; set; }

    [Range(-90, 90)]
    public double? Latitude { get; set; }

    [Range(-180, 180)]
    public double? Longitude { get; set; }
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

    [MaxLength(500)]
    public string? PhotoUrl { get; set; }

    [Range(-90, 90)]
    public double? Latitude { get; set; }

    [Range(-180, 180)]
    public double? Longitude { get; set; }
}
