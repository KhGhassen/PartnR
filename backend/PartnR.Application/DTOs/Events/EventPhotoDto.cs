using System.ComponentModel.DataAnnotations;

namespace PartnR.Application.DTOs.Events;

public class EventPhotoDto
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string Url { get; set; } = null!;
    public Guid UploaderId { get; set; }
    public string UploaderName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class AddEventPhotoDto
{
    [Required, MaxLength(500)]
    public string Url { get; set; } = null!;
}
