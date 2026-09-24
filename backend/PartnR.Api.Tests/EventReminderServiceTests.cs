using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PartnR.Api.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;
using Xunit;

namespace PartnR.Api.Tests;

public class EventReminderServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Guid _creatorId = Guid.NewGuid();
    private readonly Guid _memberId = Guid.NewGuid();
    private readonly Guid _waitlistedId = Guid.NewGuid();
    private readonly DateTime _now = new(2026, 9, 24, 10, 0, 0, DateTimeKind.Utc);

    public EventReminderServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        _db.Users.AddRange(
            MakeUser(_creatorId, "alice@test.com", "Alice"),
            MakeUser(_memberId, "bob@test.com", "Bob"),
            MakeUser(_waitlistedId, "carol@test.com", "Carol"));
        _db.SaveChanges();
    }

    private static AppUser MakeUser(Guid id, string email, string name) => new()
    {
        Id = id, UserName = email, Email = email, FirstName = name, City = "Paris",
        NormalizedEmail = email.ToUpperInvariant(), NormalizedUserName = email.ToUpperInvariant(),
        SecurityStamp = Guid.NewGuid().ToString(),
    };

    private Event AddEvent(DateTime date, EventStatus status = EventStatus.Published)
    {
        var ev = new Event
        {
            Title = "Apéro", City = "Paris", Location = "Canal", Date = date, MaxParticipants = 5,
            CreatorId = _creatorId, Status = status,
            ActivityId = Guid.Parse("a1000000-0000-0000-0000-000000000001"),
        };
        _db.Events.Add(ev);
        _db.EventParticipants.AddRange(
            new EventParticipant { EventId = ev.Id, UserId = _creatorId, Status = ParticipantStatus.Confirmed },
            new EventParticipant { EventId = ev.Id, UserId = _memberId, Status = ParticipantStatus.Confirmed },
            new EventParticipant { EventId = ev.Id, UserId = _waitlistedId, Status = ParticipantStatus.Waitlisted });
        _db.SaveChanges();
        return ev;
    }

    private Task<int> Run(DateTime? now = null) =>
        EventReminderService.RunOnceAsync(_db, new NoOpEmailService(), now ?? _now, "https://partnr.test", NullLogger.Instance, CancellationToken.None);

    [Fact]
    public async Task RemindsConfirmedParticipants_OnceEach()
    {
        var ev = AddEvent(_now.AddHours(20));

        Assert.Equal(2, await Run());
        var notifications = _db.Notifications.Where(n => n.Type == "event_reminder").ToList();
        Assert.Equal(2, notifications.Count);
        Assert.DoesNotContain(notifications, n => n.UserId == _waitlistedId);
        Assert.All(notifications, n => Assert.Equal(ev.Id, n.EventId));
        Assert.Contains("demain à", notifications[0].Message);

        // Second pass: nothing new.
        Assert.Equal(0, await Run());
        Assert.Equal(2, _db.Notifications.Count(n => n.Type == "event_reminder"));
    }

    [Fact]
    public async Task LateJoiner_StillGetsReminded()
    {
        var ev = AddEvent(_now.AddHours(20));
        await Run();

        var late = Guid.NewGuid();
        _db.Users.Add(MakeUser(late, "dan@test.com", "Dan"));
        _db.EventParticipants.Add(new EventParticipant { EventId = ev.Id, UserId = late, Status = ParticipantStatus.Confirmed });
        _db.SaveChanges();

        Assert.Equal(1, await Run(_now.AddMinutes(30)));
        Assert.Single(_db.Notifications.Where(n => n.Type == "event_reminder" && n.UserId == late));
    }

    [Fact]
    public async Task IgnoresEventsOutsideTheWindow_AndNonPublished()
    {
        AddEvent(_now.AddHours(30));
        AddEvent(_now.AddHours(-1));
        AddEvent(_now.AddHours(5), EventStatus.Cancelled);

        Assert.Equal(0, await Run());
        Assert.Empty(_db.Notifications);
    }

    public void Dispose() => _db.Dispose();
}
