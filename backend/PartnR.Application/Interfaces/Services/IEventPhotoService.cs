using PartnR.Application.DTOs.Events;

namespace PartnR.Application.Interfaces.Services;

public interface IEventPhotoService
{
    Task<EventPhotoDto> AddAsync(Guid eventId, Guid uploaderId, AddEventPhotoDto dto);
    Task DeleteAsync(Guid eventId, Guid photoId, Guid userId);
}
