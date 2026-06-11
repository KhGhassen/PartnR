using System.ComponentModel.DataAnnotations;

namespace PartnR.Application.DTOs.Events;

public class RatingDto
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Guid RaterId { get; set; }
    public string RaterName { get; set; } = null!;
    public Guid RatedUserId { get; set; }
    public int Score { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateRatingDto
{
    [Required]
    public Guid RatedUserId { get; set; }

    [Range(1, 5)]
    public int Score { get; set; }

    [MaxLength(500)]
    public string? Comment { get; set; }
}
