using Microsoft.EntityFrameworkCore;
using PartnR.Application.DTOs;
using PartnR.Application.DTOs.Admin;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class AdminService : IAdminService
{
    private readonly IUserRepository _users;
    private readonly IEventRepository _events;
    private readonly IUnitOfWork _unitOfWork;

    public AdminService(IUserRepository users, IEventRepository events, IUnitOfWork unitOfWork)
    {
        _users = users;
        _events = events;
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedResult<AdminUserDto>> ListUsersAsync(Guid requestingUserId, string? search, int page = 1, int pageSize = 20)
    {
        await EnsureAdminAsync(requestingUserId);

        var query = _users.Query();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u => u.FirstName.ToLower().Contains(term) || u.Email!.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                Email = u.Email!,
                City = u.City,
                Role = u.Role,
                IsBanned = u.IsBanned,
                EmailConfirmed = u.EmailConfirmed,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return new PaginatedResult<AdminUserDto>
        {
            Items = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminUserDto> BanUserAsync(Guid requestingUserId, Guid targetUserId)
        => await SetBannedAsync(requestingUserId, targetUserId, true);

    public async Task<AdminUserDto> UnbanUserAsync(Guid requestingUserId, Guid targetUserId)
        => await SetBannedAsync(requestingUserId, targetUserId, false);

    private async Task<AdminUserDto> SetBannedAsync(Guid requestingUserId, Guid targetUserId, bool isBanned)
    {
        await EnsureAdminAsync(requestingUserId);

        var user = await _users.FindAsync(targetUserId)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.Role == "admin")
            throw new InvalidOperationException("Impossible de bannir un administrateur.");

        user.IsBanned = isBanned;
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task<PaginatedResult<AdminEventDto>> ListEventsAsync(Guid requestingUserId, string? search, EventStatus? status, int page = 1, int pageSize = 20)
    {
        await EnsureAdminAsync(requestingUserId);

        var query = _events.Query()
            .Include(e => e.Activity)
            .Include(e => e.Creator)
            .Include(e => e.Participants)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(e => e.Title.ToLower().Contains(term) || e.City.ToLower().Contains(term));
        }

        if (status.HasValue)
            query = query.Where(e => e.Status == status.Value);

        var totalCount = await query.CountAsync();

        var events = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResult<AdminEventDto>
        {
            Items = events.Select(MapToEventDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminEventDto> CancelEventAsync(Guid requestingUserId, Guid eventId)
    {
        await EnsureAdminAsync(requestingUserId);

        var ev = await _events.Query()
            .Include(e => e.Activity)
            .Include(e => e.Creator)
            .Include(e => e.Participants)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        ev.Status = EventStatus.Cancelled;
        await _unitOfWork.SaveChangesAsync();

        return MapToEventDto(ev);
    }

    public async Task DeleteEventAsync(Guid requestingUserId, Guid eventId)
    {
        await EnsureAdminAsync(requestingUserId);

        var ev = await _events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        _events.Remove(ev);
        await _unitOfWork.SaveChangesAsync();
    }

    private static AdminEventDto MapToEventDto(Event e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        City = e.City,
        Date = e.Date,
        MaxParticipants = e.MaxParticipants,
        Status = e.Status.ToString(),
        ActivityName = e.Activity.Name,
        CreatorId = e.CreatorId,
        CreatorName = e.Creator.FirstName,
        ParticipantCount = e.Participants.Count(p => p.Status == ParticipantStatus.Confirmed),
        CreatedAt = e.CreatedAt
    };

    private async Task EnsureAdminAsync(Guid requestingUserId)
    {
        var requestingUser = await _users.FindAsync(requestingUserId);
        if (requestingUser is null || requestingUser.Role != "admin")
            throw new UnauthorizedAccessException("Admin access required.");
    }

    private static AdminUserDto MapToDto(AppUser user) => new()
    {
        Id = user.Id,
        FirstName = user.FirstName,
        Email = user.Email!,
        City = user.City,
        Role = user.Role,
        IsBanned = user.IsBanned,
        EmailConfirmed = user.EmailConfirmed,
        CreatedAt = user.CreatedAt
    };
}
