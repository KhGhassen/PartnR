using Microsoft.EntityFrameworkCore;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class ReportService : IReportService
{
    private readonly IReportRepository _reports;
    private readonly IUserRepository _users;
    private readonly IEventRepository _events;
    private readonly IUnitOfWork _unitOfWork;

    public ReportService(
        IReportRepository reports,
        IUserRepository users,
        IEventRepository events,
        IUnitOfWork unitOfWork)
    {
        _reports = reports;
        _users = users;
        _events = events;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> CreateAsync(Guid reporterId, CreateReportDto dto)
    {
        // Validate the target exists.
        var exists = dto.TargetType == "user"
            ? await _users.Query().AnyAsync(u => u.Id == dto.TargetId)
            : await _events.Query().AnyAsync(e => e.Id == dto.TargetId);
        if (!exists)
            throw new KeyNotFoundException("Cible du signalement introuvable.");

        var alreadyPending = await _reports.Query().AnyAsync(r =>
            r.ReporterId == reporterId && r.TargetType == dto.TargetType &&
            r.TargetId == dto.TargetId && r.Status == "Pending");
        if (alreadyPending)
            throw new InvalidOperationException("Vous avez déjà signalé ceci.");

        var report = new Report
        {
            ReporterId = reporterId,
            TargetType = dto.TargetType,
            TargetId = dto.TargetId,
            Reason = dto.Reason.Trim(),
        };
        _reports.Add(report);
        await _unitOfWork.SaveChangesAsync();
        return report.Id;
    }

    public async Task<List<ReportDto>> ListAsync(Guid requestingUserId)
    {
        await EnsureAdminAsync(requestingUserId);

        var reports = await _reports.Query()
            .OrderBy(r => r.Status == "Resolved")
            .ThenByDescending(r => r.CreatedAt)
            .Take(200)
            .ToListAsync();

        var userIds = reports.Where(r => r.TargetType == "user").Select(r => r.TargetId)
            .Concat(reports.Select(r => r.ReporterId))
            .Distinct().ToList();
        var eventIds = reports.Where(r => r.TargetType == "event").Select(r => r.TargetId).Distinct().ToList();

        var users = await _users.Query().Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FirstName);
        var events = await _events.Query().Where(e => eventIds.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, e => e.Title);

        return reports.Select(r => new ReportDto(
            r.Id,
            r.ReporterId,
            users.GetValueOrDefault(r.ReporterId, "?"),
            r.TargetType,
            r.TargetId,
            r.TargetType == "user"
                ? users.GetValueOrDefault(r.TargetId, "Utilisateur supprimé")
                : events.GetValueOrDefault(r.TargetId, "Événement supprimé"),
            r.Reason,
            r.Status,
            r.CreatedAt)).ToList();
    }

    public async Task ResolveAsync(Guid requestingUserId, Guid reportId)
    {
        await EnsureAdminAsync(requestingUserId);

        var report = await _reports.FindAsync(reportId)
            ?? throw new KeyNotFoundException("Signalement introuvable.");
        report.Status = "Resolved";
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task EnsureAdminAsync(Guid userId)
    {
        var user = await _users.FindAsync(userId);
        if (user is null || user.Role != "admin")
            throw new UnauthorizedAccessException("Accès réservé aux administrateurs.");
    }
}
