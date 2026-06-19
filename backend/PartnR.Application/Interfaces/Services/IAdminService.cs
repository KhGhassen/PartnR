using PartnR.Application.DTOs;
using PartnR.Application.DTOs.Admin;
using PartnR.Domain.Entities;

namespace PartnR.Application.Interfaces.Services;

public interface IAdminService
{
    Task<PaginatedResult<AdminUserDto>> ListUsersAsync(Guid requestingUserId, string? search, int page = 1, int pageSize = 20);
    Task<AdminUserDto> BanUserAsync(Guid requestingUserId, Guid targetUserId);
    Task<AdminUserDto> UnbanUserAsync(Guid requestingUserId, Guid targetUserId);
    Task<PaginatedResult<AdminEventDto>> ListEventsAsync(Guid requestingUserId, string? search, EventStatus? status, int page = 1, int pageSize = 20);
    Task<AdminEventDto> CancelEventAsync(Guid requestingUserId, Guid eventId);
    Task DeleteEventAsync(Guid requestingUserId, Guid eventId);
}
