using Microsoft.EntityFrameworkCore;
using PartnR.Api.Data;
using PartnR.Api.DTOs;
using PartnR.Api.DTOs.Admin;

namespace PartnR.Api.Services;

public class AdminService
{
    private readonly AppDbContext _db;

    public AdminService(AppDbContext db) => _db = db;

    public async Task<PaginatedResult<AdminUserDto>> ListUsersAsync(string? search, int page = 1, int pageSize = 20)
    {
        var query = _db.Users.AsQueryable();

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

    public async Task<AdminUserDto> SetBannedAsync(Guid userId, bool isBanned)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.Role == "admin")
            throw new InvalidOperationException("Impossible de bannir un administrateur.");

        user.IsBanned = isBanned;
        await _db.SaveChangesAsync();

        return new AdminUserDto
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
}
