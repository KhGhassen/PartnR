using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PartnR.Application.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;
using PartnR.Infrastructure.Repositories;
using Xunit;

namespace PartnR.Api.Tests;

public class EventChatServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly EventChatService _service;
    private readonly Guid _creatorId = Guid.NewGuid();
    private readonly Guid _outsiderId = Guid.NewGuid();
    private readonly Guid _eventId = Guid.NewGuid();

    public EventChatServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _db = new AppDbContext(options);

        _db.Users.AddRange(
            MakeUser(_creatorId, "creator@test.com", "Alice"),
            MakeUser(_outsiderId, "outsider@test.com", "Eve"));

        _db.Events.Add(new Event
        {
            Id = _eventId,
            Title = "Footing",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(3),
            MaxParticipants = 5,
            CreatorId = _creatorId,
            ActivityId = Guid.Parse("a1000000-0000-0000-0000-000000000001"),
        });

        _db.EventParticipants.Add(new EventParticipant
        {
            EventId = _eventId,
            UserId = _creatorId,
            Status = ParticipantStatus.Confirmed,
        });

        _db.SaveChanges();

        _service = new EventChatService(
            new EventParticipantRepository(_db),
            new MessageRepository(_db),
            new UserRepository(_db),
            new UnitOfWork(_db));
    }

    private static AppUser MakeUser(Guid id, string email, string name) => new()
    {
        Id = id,
        UserName = email,
        Email = email,
        FirstName = name,
        City = "Paris",
        NormalizedEmail = email.ToUpperInvariant(),
        NormalizedUserName = email.ToUpperInvariant(),
        SecurityStamp = Guid.NewGuid().ToString(),
    };

    [Fact]
    public async Task SendMessageAsync_RejectsNonParticipant_AndPersistsNothing()
    {
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.SendMessageAsync(_eventId, _outsiderId, "Coucou"));

        Assert.Empty(_db.Messages);
    }

    [Fact]
    public async Task SendMessageAsync_AllowsConfirmedParticipant()
    {
        var message = await _service.SendMessageAsync(_eventId, _creatorId, "On se retrouve à l'entrée");

        Assert.NotNull(message);
        Assert.Equal("Alice", message!.UserName);
        Assert.Single(_db.Messages);
    }

    [Fact]
    public async Task SendMessageAsync_StoresApostrophesVerbatim()
    {
        // The content used to be HTML-encoded on write and never decoded on read,
        // so every French apostrophe surfaced as "J&#39;arrive".
        var message = await _service.SendMessageAsync(_eventId, _creatorId, "J'arrive dans 10 min");

        Assert.NotNull(message);
        Assert.Equal("J'arrive dans 10 min", message!.Content);
        Assert.Equal("J'arrive dans 10 min", _db.Messages.Single().Content);
    }

    [Fact]
    public async Task SendMessageAsync_RejectsWaitlistedUser()
    {
        _db.EventParticipants.Add(new EventParticipant
        {
            EventId = _eventId,
            UserId = _outsiderId,
            Status = ParticipantStatus.Waitlisted,
        });
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.SendMessageAsync(_eventId, _outsiderId, "Je suis là"));
    }

    public void Dispose() => _db.Dispose();
}
