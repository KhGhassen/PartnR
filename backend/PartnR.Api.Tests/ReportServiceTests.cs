using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PartnR.Application.Interfaces.Services;
using PartnR.Application.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;
using PartnR.Infrastructure.Repositories;
using Xunit;

namespace PartnR.Api.Tests;

public class ReportServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly ReportService _service;
    private readonly Guid _adminId = Guid.NewGuid();
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _eventId = Guid.NewGuid();

    public ReportServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _db = new AppDbContext(options);

        _db.Users.AddRange(
            new AppUser
            {
                Id = _adminId, UserName = "a@t.com", Email = "a@t.com", FirstName = "Admin",
                City = "Paris", Role = "admin", NormalizedEmail = "A@T.COM",
                NormalizedUserName = "A@T.COM", SecurityStamp = Guid.NewGuid().ToString(),
            },
            new AppUser
            {
                Id = _userId, UserName = "u@t.com", Email = "u@t.com", FirstName = "User",
                City = "Paris", NormalizedEmail = "U@T.COM",
                NormalizedUserName = "U@T.COM", SecurityStamp = Guid.NewGuid().ToString(),
            });

        _db.Events.Add(new Event
        {
            Id = _eventId,
            Title = "Suspicious Event",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            CreatorId = _userId,
            ActivityId = Guid.Parse("a1000000-0000-0000-0000-000000000001"),
        });
        _db.SaveChanges();

        _service = new ReportService(
            new ReportRepository(_db),
            new UserRepository(_db),
            new EventRepository(_db),
            new UnitOfWork(_db));
    }

    [Fact]
    public async Task CreateAsync_CreatesReport_AndRejectsDuplicatePending()
    {
        var dto = new CreateReportDto { TargetType = "event", TargetId = _eventId, Reason = "Contenu inapproprié dans la description" };

        var id = await _service.CreateAsync(_userId, dto);
        Assert.NotEqual(Guid.Empty, id);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(_userId, dto));
    }

    [Fact]
    public async Task CreateAsync_RejectsUnknownTarget()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.CreateAsync(_userId, new CreateReportDto { TargetType = "user", TargetId = Guid.NewGuid(), Reason = "Comportement suspect signalé" }));
    }

    [Fact]
    public async Task ListAsync_RequiresAdmin_AndResolvesLabels()
    {
        await _service.CreateAsync(_userId, new CreateReportDto { TargetType = "event", TargetId = _eventId, Reason = "Contenu inapproprié dans la description" });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.ListAsync(_userId));

        var list = await _service.ListAsync(_adminId);
        Assert.Single(list);
        Assert.Equal("Suspicious Event", list[0].TargetLabel);
        Assert.Equal("User", list[0].ReporterName);
    }

    [Fact]
    public async Task ResolveAsync_MarksResolved_AdminOnly()
    {
        var id = await _service.CreateAsync(_userId, new CreateReportDto { TargetType = "user", TargetId = _userId, Reason = "Auto-signalement de test valide" });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.ResolveAsync(_userId, id));

        await _service.ResolveAsync(_adminId, id);
        Assert.Equal("Resolved", _db.Reports.Single(r => r.Id == id).Status);
    }

    public void Dispose() => _db.Dispose();
}
