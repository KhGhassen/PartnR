using Microsoft.EntityFrameworkCore;
using PartnR.Application.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;
using PartnR.Infrastructure.Repositories;
using Xunit;

namespace PartnR.Api.Tests;

public class BlockServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly BlockService _service;
    private readonly Guid _aliceId = Guid.NewGuid();
    private readonly Guid _bobId = Guid.NewGuid();

    public BlockServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _db.Users.AddRange(MakeUser(_aliceId, "alice@test.com", "Alice"), MakeUser(_bobId, "bob@test.com", "Bob"));
        _db.SaveChanges();

        _service = new BlockService(
            new UserBlockRepository(_db),
            new UserRepository(_db),
            new EventRepository(_db),
            new EventParticipantRepository(_db),
            new UnitOfWork(_db));
    }

    private static AppUser MakeUser(Guid id, string email, string name) => new()
    {
        Id = id, UserName = email, Email = email, FirstName = name, City = "Paris",
        NormalizedEmail = email.ToUpperInvariant(), NormalizedUserName = email.ToUpperInvariant(),
        SecurityStamp = Guid.NewGuid().ToString(),
    };

    [Fact]
    public async Task BlockAsync_IsIdempotent_AndListed()
    {
        await _service.BlockAsync(_aliceId, _bobId);
        await _service.BlockAsync(_aliceId, _bobId);

        Assert.Single(_db.UserBlocks);
        var list = await _service.ListAsync(_aliceId);
        Assert.Single(list);
        Assert.Equal("Bob", list[0].FirstName);
        Assert.Empty(await _service.ListAsync(_bobId));
    }

    [Fact]
    public async Task BlockAsync_RefusesSelf_AndUnknownUsers()
    {
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.BlockAsync(_aliceId, _aliceId));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.BlockAsync(_aliceId, Guid.NewGuid()));
    }

    [Fact]
    public async Task BlockAsync_DropsTheBlockedUserFromMyUpcomingEvents_Only()
    {
        var upcoming = new Event
        {
            Title = "Apéro", City = "Paris", Date = DateTime.UtcNow.AddDays(2), MaxParticipants = 5,
            CreatorId = _aliceId, ActivityId = Guid.Parse("a1000000-0000-0000-0000-000000000001"),
        };
        var past = new Event
        {
            Title = "Vieux footing", City = "Paris", Date = DateTime.UtcNow.AddDays(-2), MaxParticipants = 5,
            CreatorId = _aliceId, ActivityId = upcoming.ActivityId,
        };
        var bobs = new Event
        {
            Title = "Chez Bob", City = "Paris", Date = DateTime.UtcNow.AddDays(3), MaxParticipants = 5,
            CreatorId = _bobId, ActivityId = upcoming.ActivityId,
        };
        _db.Events.AddRange(upcoming, past, bobs);
        _db.EventParticipants.AddRange(
            new EventParticipant { EventId = upcoming.Id, UserId = _bobId },
            new EventParticipant { EventId = past.Id, UserId = _bobId },
            new EventParticipant { EventId = bobs.Id, UserId = _aliceId });
        await _db.SaveChangesAsync();

        await _service.BlockAsync(_aliceId, _bobId);

        Assert.Equal(ParticipantStatus.Cancelled, _db.EventParticipants.Single(p => p.EventId == upcoming.Id && p.UserId == _bobId).Status);
        Assert.Equal(ParticipantStatus.Confirmed, _db.EventParticipants.Single(p => p.EventId == past.Id && p.UserId == _bobId).Status);
        Assert.Equal(ParticipantStatus.Confirmed, _db.EventParticipants.Single(p => p.EventId == bobs.Id && p.UserId == _aliceId).Status);
    }

    [Fact]
    public async Task UnblockAsync_RemovesTheBlock_AndIsSilentWhenAbsent()
    {
        await _service.BlockAsync(_aliceId, _bobId);
        await _service.UnblockAsync(_aliceId, _bobId);
        await _service.UnblockAsync(_aliceId, _bobId);

        Assert.Empty(_db.UserBlocks);
    }

    public void Dispose() => _db.Dispose();
}
