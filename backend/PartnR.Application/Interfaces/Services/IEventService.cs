using PartnR.Application.DTOs;
using PartnR.Application.DTOs.Events;
using PartnR.Domain.Entities;

namespace PartnR.Application.Interfaces.Services;

public interface IEventService
{
    Task<PaginatedResult<EventDto>> ListAsync(string? city, Guid? activityId, EventStatus? status, int page = 1, int pageSize = 20, bool mine = false, Guid? userId = null, double? lat = null, double? lng = null, double? radiusKm = null, string? search = null);
    Task<EventDetailDto> GetByIdAsync(Guid id);
    Task<EventDetailDto> CreateAsync(Guid creatorId, CreateEventDto dto);
    Task<EventDetailDto> UpdateAsync(Guid eventId, Guid userId, UpdateEventDto dto);
    Task JoinAsync(Guid eventId, Guid userId);
    Task LeaveAsync(Guid eventId, Guid userId);
    Task DeleteAsync(Guid eventId, Guid userId);
}
