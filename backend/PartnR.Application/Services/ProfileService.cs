using Microsoft.EntityFrameworkCore;
using PartnR.Application.DTOs.Profiles;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class ProfileService : IProfileService
{
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _unitOfWork;

    public ProfileService(IUserRepository users, IUnitOfWork unitOfWork)
    {
        _users = users;
        _unitOfWork = unitOfWork;
    }

    public async Task<ProfileDto> GetByIdAsync(Guid userId)
    {
        var user = await _users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        return MapToDto(user);
    }

    public async Task<ProfileDto> UpdateAsync(Guid userId, UpdateProfileDto dto)
    {
        var user = await _users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (dto.FirstName is not null) user.FirstName = dto.FirstName;
        if (dto.City is not null) user.City = dto.City;
        if (dto.Bio is not null) user.Bio = dto.Bio;
        if (dto.AvatarUrl is not null) user.AvatarUrl = dto.AvatarUrl;
        if (dto.FavoriteActivities is not null) user.FavoriteActivities = dto.FavoriteActivities;

        await _unitOfWork.SaveChangesAsync();
        return MapToDto(user);
    }

    public async Task<List<ProfileDto>> SearchAsync(string? city, string? activity)
    {
        var query = _users.Query();

        if (!string.IsNullOrEmpty(city))
            query = query.Where(u => u.City.ToLower() == city.ToLower());

        if (!string.IsNullOrEmpty(activity))
            query = query.Where(u => u.FavoriteActivities.Contains(activity));

        var users = await query.OrderByDescending(u => u.RatingAvg).Take(50).ToListAsync();
        return users.Select(MapToDto).ToList();
    }

    private static ProfileDto MapToDto(AppUser u) => new()
    {
        Id = u.Id,
        FirstName = u.FirstName,
        City = u.City,
        Bio = u.Bio,
        AvatarUrl = u.AvatarUrl,
        FavoriteActivities = u.FavoriteActivities,
        RatingAvg = (double)u.RatingAvg,
        RatingCount = u.RatingCount,
        CreatedAt = u.CreatedAt
    };
}
