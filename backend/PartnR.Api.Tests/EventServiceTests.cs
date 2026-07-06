using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;
using PartnR.Infrastructure.Repositories;
using Xunit;

namespace PartnR.Api.Tests;

public class EventServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly EventService _service;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _activityId = Guid.Parse("a1000000-0000-0000-0000-000000000001");

    public EventServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _db = new AppDbContext(options);

        // Seed activity
        _db.Activities.Add(new Activity
        {
            Id = _activityId,
            Name = "Running",
            Slug = "running",
            Icon = "🏃"
        });

        // Seed user
        _db.Users.Add(new AppUser
        {
            Id = _userId,
            UserName = "test@test.com",
            Email = "test@test.com",
            FirstName = "Test",
            City = "Paris",
            NormalizedEmail = "TEST@TEST.COM",
            NormalizedUserName = "TEST@TEST.COM",
            SecurityStamp = Guid.NewGuid().ToString()
        });

        _db.SaveChanges();
        var unitOfWork = new UnitOfWork(_db);
        _service = new EventService(
            new EventRepository(_db),
            new ActivityRepository(_db),
            new EventParticipantRepository(_db),
            unitOfWork);
    }

    [Fact]
    public async Task CreateAsync_CreatesEventAndAddsCreatorAsParticipant()
    {
        var dto = new CreateEventDto
        {
            Title = "Morning Run",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(7),
            MaxParticipants = 5,
            ActivityId = _activityId
        };

        var result = await _service.CreateAsync(_userId, dto);

        Assert.Equal("Morning Run", result.Title);
        Assert.Equal("Paris", result.City);
        Assert.Equal(1, result.ParticipantCount);
        Assert.Equal("Published", result.Status);
        Assert.Equal(_userId, result.CreatorId);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsEventWithParticipants()
    {
        var dto = new CreateEventDto
        {
            Title = "Yoga Session",
            City = "Lyon",
            Date = DateTime.UtcNow.AddDays(3),
            MaxParticipants = 10,
            ActivityId = _activityId
        };

        var created = await _service.CreateAsync(_userId, dto);
        var result = await _service.GetByIdAsync(created.Id);

        Assert.Equal("Yoga Session", result.Title);
        Assert.Single(result.Participants);
        Assert.Equal(_userId, result.Participants[0].UserId);
    }

    [Fact]
    public async Task JoinAsync_AddsParticipant()
    {
        var dto = new CreateEventDto
        {
            Title = "Tennis Match",
            City = "Marseille",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 4,
            ActivityId = _activityId
        };

        var created = await _service.CreateAsync(_userId, dto);

        var user2Id = Guid.NewGuid();
        _db.Users.Add(new AppUser
        {
            Id = user2Id,
            UserName = "user2@test.com",
            Email = "user2@test.com",
            FirstName = "Alice",
            City = "Marseille",
            NormalizedEmail = "USER2@TEST.COM",
            NormalizedUserName = "USER2@TEST.COM",
            SecurityStamp = Guid.NewGuid().ToString()
        });
        await _db.SaveChangesAsync();

        await _service.JoinAsync(created.Id, user2Id);

        var updated = await _service.GetByIdAsync(created.Id);
        Assert.Equal(2, updated.ParticipantCount);
    }

    [Fact]
    public async Task JoinAsync_ThrowsWhenFull()
    {
        var dto = new CreateEventDto
        {
            Title = "Small Event",
            City = "Nice",
            Date = DateTime.UtcNow.AddDays(2),
            MaxParticipants = 2,
            ActivityId = _activityId
        };

        var created = await _service.CreateAsync(_userId, dto);

        // Add second participant
        var user2Id = Guid.NewGuid();
        _db.Users.Add(new AppUser
        {
            Id = user2Id,
            UserName = "u2@test.com",
            Email = "u2@test.com",
            FirstName = "Bob",
            City = "Nice",
            NormalizedEmail = "U2@TEST.COM",
            NormalizedUserName = "U2@TEST.COM",
            SecurityStamp = Guid.NewGuid().ToString()
        });
        await _db.SaveChangesAsync();
        await _service.JoinAsync(created.Id, user2Id);

        // Third should fail
        var user3Id = Guid.NewGuid();
        _db.Users.Add(new AppUser
        {
            Id = user3Id,
            UserName = "u3@test.com",
            Email = "u3@test.com",
            FirstName = "Charlie",
            City = "Nice",
            NormalizedEmail = "U3@TEST.COM",
            NormalizedUserName = "U3@TEST.COM",
            SecurityStamp = Guid.NewGuid().ToString()
        });
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.JoinAsync(created.Id, user3Id));
    }

    [Fact]
    public async Task LeaveAsync_CancelsParticipation()
    {
        var dto = new CreateEventDto
        {
            Title = "Group Hike",
            City = "Grenoble",
            Date = DateTime.UtcNow.AddDays(10),
            MaxParticipants = 10,
            ActivityId = _activityId
        };

        var created = await _service.CreateAsync(_userId, dto);

        var user2Id = Guid.NewGuid();
        _db.Users.Add(new AppUser
        {
            Id = user2Id,
            UserName = "u4@test.com",
            Email = "u4@test.com",
            FirstName = "Diana",
            City = "Grenoble",
            NormalizedEmail = "U4@TEST.COM",
            NormalizedUserName = "U4@TEST.COM",
            SecurityStamp = Guid.NewGuid().ToString()
        });
        await _db.SaveChangesAsync();
        await _service.JoinAsync(created.Id, user2Id);

        await _service.LeaveAsync(created.Id, user2Id);

        var updated = await _service.GetByIdAsync(created.Id);
        Assert.Equal(1, updated.ParticipantCount);
    }

    [Fact]
    public async Task LeaveAsync_CreatorCannotLeave()
    {
        var dto = new CreateEventDto
        {
            Title = "Creator Leave Test",
            City = "Toulouse",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId
        };

        var created = await _service.CreateAsync(_userId, dto);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.LeaveAsync(created.Id, _userId));
    }

    [Fact]
    public async Task DeleteAsync_OnlyCreatorCanDelete()
    {
        var dto = new CreateEventDto
        {
            Title = "Delete Test",
            City = "Bordeaux",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId
        };

        var created = await _service.CreateAsync(_userId, dto);
        var otherUserId = Guid.NewGuid();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.DeleteAsync(created.Id, otherUserId));
    }

    [Fact]
    public async Task UpdateAsync_UpdatesFields()
    {
        var dto = new CreateEventDto
        {
            Title = "Original Title",
            City = "Strasbourg",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId
        };

        var created = await _service.CreateAsync(_userId, dto);

        var updated = await _service.UpdateAsync(created.Id, _userId, new UpdateEventDto
        {
            Title = "Updated Title",
            MaxParticipants = 10
        });

        Assert.Equal("Updated Title", updated.Title);
        Assert.Equal(10, updated.MaxParticipants);
        Assert.Equal("Strasbourg", updated.City); // unchanged
    }

    [Fact]
    public async Task CreateAsync_AndUpdateAsync_SetPhotoUrl()
    {
        var dto = new CreateEventDto
        {
            Title = "Photo Event",
            City = "Nantes",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId,
            PhotoUrl = "https://example.com/cover.jpg"
        };

        var created = await _service.CreateAsync(_userId, dto);
        Assert.Equal("https://example.com/cover.jpg", created.PhotoUrl);

        var updated = await _service.UpdateAsync(created.Id, _userId, new UpdateEventDto
        {
            PhotoUrl = "https://example.com/new-cover.jpg"
        });

        Assert.Equal("https://example.com/new-cover.jpg", updated.PhotoUrl);
    }

    [Fact]
    public async Task ListAsync_FiltersbyCity()
    {
        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Paris Event",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId
        });
        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Lyon Event",
            City = "Lyon",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId
        });

        var result = await _service.ListAsync("paris", null, null);
        Assert.Single(result.Items);
        Assert.Equal("Paris Event", result.Items[0].Title);
    }

    [Fact]
    public async Task ListAsync_ReturnsPaginatedResult()
    {
        for (int i = 0; i < 5; i++)
        {
            await _service.CreateAsync(_userId, new CreateEventDto
            {
                Title = $"Event {i}",
                City = "Paris",
                Date = DateTime.UtcNow.AddDays(i + 1),
                MaxParticipants = 10,
                ActivityId = _activityId
            });
        }

        var result = await _service.ListAsync(null, null, null, page: 1, pageSize: 3);
        Assert.Equal(3, result.Items.Count);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.Equal(3, result.PageSize);
        Assert.Equal(2, result.TotalPages);
        Assert.True(result.HasNextPage);
    }

    [Fact]
    public async Task ListAsync_SecondPageReturnsRemaining()
    {
        for (int i = 0; i < 5; i++)
        {
            await _service.CreateAsync(_userId, new CreateEventDto
            {
                Title = $"Event {i}",
                City = "Paris",
                Date = DateTime.UtcNow.AddDays(i + 1),
                MaxParticipants = 10,
                ActivityId = _activityId
            });
        }

        var result = await _service.ListAsync(null, null, null, page: 2, pageSize: 3);
        Assert.Equal(2, result.Items.Count);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(2, result.Page);
        Assert.False(result.HasNextPage);
    }

    [Fact]
    public async Task CreateAsync_AndUpdateAsync_SetCoordinates()
    {
        var dto = new CreateEventDto
        {
            Title = "Geo Event",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId,
            Latitude = 48.8566,
            Longitude = 2.3522
        };

        var created = await _service.CreateAsync(_userId, dto);
        Assert.Equal(48.8566, created.Latitude);
        Assert.Equal(2.3522, created.Longitude);

        var updated = await _service.UpdateAsync(created.Id, _userId, new UpdateEventDto
        {
            Latitude = 45.7640,
            Longitude = 4.8357
        });

        Assert.Equal(45.7640, updated.Latitude);
        Assert.Equal(4.8357, updated.Longitude);
    }

    [Fact]
    public async Task ListAsync_Search_MatchesTitleAndDescription()
    {
        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Footing matinal",
            Description = "Course tranquille au parc",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId
        });
        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Soirée ramen",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId
        });

        var byTitle = await _service.ListAsync(null, null, null, search: "ramen");
        Assert.Single(byTitle.Items);
        Assert.Equal("Soirée ramen", byTitle.Items[0].Title);

        var byDescription = await _service.ListAsync(null, null, null, search: "parc");
        Assert.Single(byDescription.Items);
        Assert.Equal("Footing matinal", byDescription.Items[0].Title);
    }

    [Fact]
    public async Task ListAsync_NearMe_FiltersByRadiusAndSortsByDistance()
    {
        // Paris
        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Paris Event",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId,
            Latitude = 48.8566,
            Longitude = 2.3522
        });
        // Lyon (~390km from Paris)
        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Lyon Event",
            City = "Lyon",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId,
            Latitude = 45.7640,
            Longitude = 4.8357
        });
        // No coordinates at all
        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "No Coords Event",
            City = "Marseille",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            ActivityId = _activityId
        });

        // Search near Paris with a 50km radius
        var result = await _service.ListAsync(null, null, null, lat: 48.85, lng: 2.35, radiusKm: 50);

        Assert.Single(result.Items);
        Assert.Equal("Paris Event", result.Items[0].Title);
        Assert.NotNull(result.Items[0].DistanceKm);
        Assert.True(result.Items[0].DistanceKm < 50);
    }

    public void Dispose() => _db.Dispose();
}
