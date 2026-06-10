using PartnR.Application.DTOs;
using PartnR.Application.DTOs.Admin;

namespace PartnR.Application.Interfaces.Services;

public interface IAdminService
{
    Task<PaginatedResult<AdminUserDto>> ListUsersAsync(Guid requestingUserId, string? search, int page = 1, int pageSize = 20);
    Task<AdminUserDto> BanUserAsync(Guid requestingUserId, Guid targetUserId);
    Task<AdminUserDto> UnbanUserAsync(Guid requestingUserId, Guid targetUserId);
}
