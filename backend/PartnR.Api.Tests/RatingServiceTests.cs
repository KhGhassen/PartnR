using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PartnR.Api.Data;
using PartnR.Api.DTOs.Events;
using PartnR.Api.Entities;
using PartnR.Api.Services;
using Xunit;

namespace PartnR.Api.Tests;

public class RatingServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly RatingService _ratingService;
    private readonly EventService _eventService;
    private readonly Guid _user1Id = Guid.NewGuid();
    private readonly Guid _user2Id = Guid.NewGuid();
    private readonly Guid _activityId = Guid.Parse("a1000000-0000-0000-0000-000000000001");
    private Guid _completedEventId;

    public RatingServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _db = new AppDbContext(options);
        _ratingService = new RatingService(_db);
        _eventService = new EventService(_db);

        // Seed
        _db.Activities.Add(new Activity { Id = _activityId, Name = "Running", Slug = "running", Icon = "🏃" });
        _db.Users.AddRange(
            new AppUser
            {
                Id = _user1Id, UserName = "u1@test.com", Email = "u1@test.com",
                FirstName = "Alice", City = "Paris",
                NormalizedEmail = "U1@TEST.COM", NormalizedUserName = "U1@TEST.COM",
                SecurityStamp = Guid.NewGuid().ToString()
            },
            new AppUser
            {
                Id = _user2Id, UserName = "u2@test.com", Email = "u2@test.com",
                FirstName = "Bob", City = "Paris",
                NormalizedEmail = "U2@TEST.COM", NormalizedUserName = "U2@TEST.COM",
                SecurityStamp = Guid.NewGuid().ToString()
            }
        );
        _db.SaveChanges();

        // Create a completed event with both users as participants
        var ev = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Past Run",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(-1),
            MaxParticipants = 10,
            ActivityId = _activityId,
            CreatorId = _user1Id,
            Status = EventStatus.Completed
        };
        ev.Participants.Add(new EventParticipant { UserId = _user1Id, Status = ParticipantStatus.Confirmed });
        ev.Participants.Add(new EventParticipant { UserId = _user2Id, Status = ParticipantStatus.Confirmed });
        _db.Events.Add(ev);
        _db.SaveChanges();
        _completedEventId = ev.Id;
    }

    [Fact]
    public async Task CreateAsync_ValidRating_ReturnsDto()
    {
        var dto = new CreateRatingDto { RatedUserId = _user2Id, Score = 4, Comment = "Great partner!" };
        var result = await _ratingService.CreateAsync(_completedEventId, _user1Id, dto);

        Assert.Equal(4, result.Score);
        Assert.Equal("Great partner!", result.Comment);
        Assert.Equal(_user1Id, result.RaterId);
        Assert.Equal(_user2Id, result.RatedUserId);
        Assert.Equal("Alice", result.RaterName);
    }

    [Fact]
    public async Task CreateAsync_UpdatesUserAverage()
    {
        var dto = new CreateRatingDto { RatedUserId = _user2Id, Score = 5 };
        await _ratingService.CreateAsync(_completedEventId, _user1Id, dto);

        var user = await _db.Users.FindAsync(_user2Id);
        Assert.Equal(5m, user!.RatingAvg);
        Assert.Equal(1, user.RatingCount);
    }

    [Fact]
    public async Task CreateAsync_ThrowsWhenEventNotCompleted()
    {
        // Create a published event
        var ev = new Event
        {
            Title = "Future Run", City = "Lyon", Date = DateTime.UtcNow.AddDays(7),
            MaxParticipants = 10, ActivityId = _activityId, CreatorId = _user1Id,
            Status = EventStatus.Published
        };
        ev.Participants.Add(new EventParticipant { UserId = _user1Id, Status = ParticipantStatus.Confirmed });
        ev.Participants.Add(new EventParticipant { UserId = _user2Id, Status = ParticipantStatus.Confirmed });
        _db.Events.Add(ev);
        await _db.SaveChangesAsync();

        var dto = new CreateRatingDto { RatedUserId = _user2Id, Score = 3 };
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _ratingService.CreateAsync(ev.Id, _user1Id, dto));
    }

    [Fact]
    public async Task CreateAsync_ThrowsOnSelfRating()
    {
        var dto = new CreateRatingDto { RatedUserId = _user1Id, Score = 5 };
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _ratingService.CreateAsync(_completedEventId, _user1Id, dto));
    }

    [Fact]
    public async Task CreateAsync_ThrowsOnDuplicate()
    {
        var dto = new CreateRatingDto { RatedUserId = _user2Id, Score = 4 };
        await _ratingService.CreateAsync(_completedEventId, _user1Id, dto);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _ratingService.CreateAsync(_completedEventId, _user1Id, dto));
    }

    [Fact]
    public async Task GetForUserAsync_ReturnsRatings()
    {
        var dto = new CreateRatingDto { RatedUserId = _user2Id, Score = 4, Comment = "Nice" };
        await _ratingService.CreateAsync(_completedEventId, _user1Id, dto);

        var ratings = await _ratingService.GetForUserAsync(_user2Id);
        Assert.Single(ratings);
        Assert.Equal(4, ratings[0].Score);
        Assert.Equal("Alice", ratings[0].RaterName);
    }

    public void Dispose() => _db.Dispose();
}
