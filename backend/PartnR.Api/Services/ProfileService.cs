using Microsoft.EntityFrameworkCore;
using PartnR.Api.Data;
using PartnR.Api.DTOs.Profiles;

namespace PartnR.Api.Services;

public class ProfileService
{
    private readonly AppDbContext _db;

    public ProfileService(AppDbContext db) => _db = db;

    public async Task<ProfileDto> GetByIdAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        return MapToDto(user);
    }

    public async Task<ProfileDto> UpdateAsync(Guid userId, UpdateProfileDto dto)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (dto.FirstName is not null) user.FirstName = dto.FirstName;
        if (dto.City is not null) user.City = dto.City;
        if (dto.Bio is not null) user.Bio = dto.Bio;
        if (dto.AvatarUrl is not null) user.AvatarUrl = dto.AvatarUrl;
        if (dto.FavoriteActivities is not null) user.FavoriteActivities = dto.FavoriteActivities;

        await _db.SaveChangesAsync();
        return MapToDto(user);
    }

    public async Task<List<ProfileDto>> SearchAsync(string? city, string? activity)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrEmpty(city))
            query = query.Where(u => u.City.ToLower() == city.ToLower());

        if (!string.IsNullOrEmpty(activity))
            query = query.Where(u => u.FavoriteActivities.Contains(activity));

        var users = await query.OrderByDescending(u => u.RatingAvg).Take(50).ToListAsync();
        return users.Select(MapToDto).ToList();
    }

    private static ProfileDto MapToDto(Entities.AppUser u) => new()
    {
        Id = u.Id,
        FirstName = u.FirstName,
        City = u.City,
        Bio = u.Bio,
        AvatarUrl = u.AvatarUrl,
        FavoriteActivities = u.FavoriteActivities,
        RatingAvg = u.RatingAvg,
        RatingCount = u.RatingCount,
        CreatedAt = u.CreatedAt
    };
}
