using PartnR.Application.DTOs.Events;

namespace PartnR.Application.Interfaces.Services;

public interface IEventCommentService
{
    Task<List<EventCommentDto>> ListAsync(Guid eventId);
    Task<EventCommentDto> AddAsync(Guid eventId, Guid userId, AddEventCommentDto dto);
    Task DeleteAsync(Guid eventId, Guid commentId, Guid userId);
}
