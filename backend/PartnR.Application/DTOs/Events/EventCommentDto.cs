using System.ComponentModel.DataAnnotations;

namespace PartnR.Application.DTOs.Events;

public class EventCommentDto
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string? UserAvatarUrl { get; set; }
    public bool IsOrganizer { get; set; }
    public string Content { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class AddEventCommentDto
{
    [Required, MaxLength(500)]
    public string Content { get; set; } = null!;
}
