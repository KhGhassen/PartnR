using PartnR.Application.DTOs.Profiles;

namespace PartnR.Application.Interfaces.Services;

public interface IProfileService
{
    Task<ProfileDto> GetByIdAsync(Guid userId);
    Task<ProfileDto> UpdateAsync(Guid userId, UpdateProfileDto dto);
    Task<List<ProfileDto>> SearchAsync(string? city, string? activity);
}
