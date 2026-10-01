using Microsoft.EntityFrameworkCore;
using PartnR.Application.DTOs.Profiles;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class ProfileService : IProfileService
{
    private readonly IUserRepository _users;
    private readonly IEventParticipantRepository _participants;
    private readonly IUnitOfWork _unitOfWork;

    public ProfileService(IUserRepository users, IEventParticipantRepository participants, IUnitOfWork unitOfWork)
    {
        _users = users;
        _participants = participants;
        _unitOfWork = unitOfWork;
    }

    public async Task<ProfileDto> GetByIdAsync(Guid userId)
    {
        var user = await _users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var dto = MapToDto(user);
        await FillReliabilityAsync(dto);
        return dto;
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
        if (dto.ProfileType.HasValue) user.ProfileType = dto.ProfileType.Value;

        await _unitOfWork.SaveChangesAsync();
        var result = MapToDto(user);
        await FillReliabilityAsync(result);
        return result;
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

    // Reliability is what makes strangers show up: how many outings this
    // person was marked present at, and the share of marks that were
    // "present". Null until an organiser has marked anything, so a newcomer
    // reads as new, not as unreliable.
    private async Task FillReliabilityAsync(ProfileDto dto)
    {
        var marks = await _participants.Query()
            .Where(p => p.UserId == dto.Id && p.Attendance != AttendanceStatus.Unknown)
            .GroupBy(p => p.Attendance)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync();

        var present = marks.FirstOrDefault(m => m.Key == AttendanceStatus.Present)?.Count ?? 0;
        var absent = marks.FirstOrDefault(m => m.Key == AttendanceStatus.Absent)?.Count ?? 0;
        dto.SortiesCount = present;
        dto.ReliabilityPercent = present + absent == 0 ? null : (int)Math.Round(100.0 * present / (present + absent));
    }

    private static ProfileDto MapToDto(AppUser u) => new()
    {
        Id = u.Id,
        FirstName = u.FirstName,
        City = u.City,
        Bio = u.Bio,
        AvatarUrl = u.AvatarUrl,
        FavoriteActivities = u.FavoriteActivities,
        ProfileType = u.ProfileType?.ToString(),
        RatingAvg = (double)u.RatingAvg,
        RatingCount = u.RatingCount,
        CreatedAt = u.CreatedAt
    };
}
