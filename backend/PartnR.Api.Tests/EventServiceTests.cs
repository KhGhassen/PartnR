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
            new NotificationRepository(_db),
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
        // The roster is only served to signed-in viewers.
        var result = await _service.GetByIdAsync(created.Id, Guid.NewGuid());

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
    public async Task JoinAsync_WhenFull_AddsToWaitlist_AndLeavePromotes()
    {
        var dto = new CreateEventDto
        {
            Title = "Waitlist Event",
            City = "Nice",
            Date = DateTime.UtcNow.AddDays(2),
            MaxParticipants = 2,
            ActivityId = _activityId
        };
        var created = await _service.CreateAsync(_userId, dto);

        var ids = new List<Guid>();
        for (int i = 0; i < 2; i++)
        {
            var uid = Guid.NewGuid();
            ids.Add(uid);
            _db.Users.Add(new AppUser
            {
                Id = uid,
                UserName = $"w{i}@test.com",
                Email = $"w{i}@test.com",
                FirstName = $"W{i}",
                City = "Nice",
                NormalizedEmail = $"W{i}@TEST.COM",
                NormalizedUserName = $"W{i}@TEST.COM",
                SecurityStamp = Guid.NewGuid().ToString()
            });
        }
        await _db.SaveChangesAsync();

        await _service.JoinAsync(created.Id, ids[0]); // fills the event (creator + 1)
        await _service.JoinAsync(created.Id, ids[1]); // goes to the waitlist

        var waitlisted = _db.EventParticipants.Single(p => p.UserId == ids[1]);
        Assert.Equal(ParticipantStatus.Waitlisted, waitlisted.Status);

        await _service.LeaveAsync(created.Id, ids[0]); // frees a spot

        var promoted = _db.EventParticipants.Single(p => p.UserId == ids[1]);
        Assert.Equal(ParticipantStatus.Confirmed, promoted.Status);
        Assert.Contains(_db.Notifications, n => n.UserId == ids[1] && n.Type == "waitlist_promoted");
    }

    [Fact]
    public async Task JoinAsync_WhenFull_Waitlists()
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

        // A full event no longer rejects the join — it waitlists instead.
        await _service.JoinAsync(created.Id, user3Id);
        var third = _db.EventParticipants.Single(p => p.UserId == user3Id);
        Assert.Equal(ParticipantStatus.Waitlisted, third.Status);

        var updated = await _service.GetByIdAsync(created.Id);
        Assert.Equal(2, updated.ParticipantCount); // waitlisted people don't count
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
    public async Task CreateAsync_WithRecurrence_CreatesWeeklyOccurrences()
    {
        var start = DateTime.UtcNow.AddDays(3);
        var created = await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Footing hebdo",
            City = "Paris",
            Date = start,
            MaxParticipants = 5,
            ActivityId = _activityId,
            RecurrenceWeeks = 4
        });

        var group = _db.Events.Where(e => e.Title == "Footing hebdo").OrderBy(e => e.Date).ToList();
        Assert.Equal(4, group.Count);
        Assert.All(group, e => Assert.NotNull(e.RecurrenceGroupId));
        Assert.Single(group.Select(e => e.RecurrenceGroupId).Distinct());
        Assert.Equal(start.Date.AddDays(7), group[1].Date.Date);
        Assert.Equal(start.Date.AddDays(21), group[3].Date.Date);
        Assert.Equal(created.Id, group[0].Id); // returns the first occurrence
        Assert.All(group, e => Assert.Contains(e.Participants, p => p.UserId == _userId));
    }

    [Fact]
    public async Task ListAsync_CollapsesRecurringSeriesToNextOccurrence()
    {
        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Foot hebdo",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(2),
            MaxParticipants = 5,
            ActivityId = _activityId,
            RecurrenceWeeks = 4
        });
        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Événement simple",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(3),
            MaxParticipants = 5,
            ActivityId = _activityId
        });

        var list = await _service.ListAsync(null, null, null);

        // One card for the series (its next occurrence) + the single event.
        Assert.Equal(2, list.Items.Count);
        var series = list.Items.Single(i => i.Title == "Foot hebdo");
        Assert.True(series.IsRecurring);
        Assert.Equal(4, series.UpcomingOccurrences);
        Assert.Equal(DateTime.UtcNow.AddDays(2).Date, series.Date.Date);

        // "Mes événements" collapses the series the same way.
        var mine = await _service.ListAsync(null, null, null, mine: true, userId: _userId);
        Assert.Equal(2, mine.Items.Count);
        Assert.True(mine.Items.Single(i => i.Title == "Foot hebdo").IsRecurring);

        // The detail exposes the sibling dates.
        var detail = await _service.GetByIdAsync(series.Id);
        Assert.Equal(4, detail.Occurrences.Count);
    }

    [Fact]
    public async Task UpdateAsync_AndDeleteAsync_ApplyToSeries()
    {
        var created = await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Série",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(2),
            MaxParticipants = 5,
            ActivityId = _activityId,
            RecurrenceWeeks = 3
        });

        await _service.UpdateAsync(created.Id, _userId, new UpdateEventDto { Title = "Série renommée" }, applyToSeries: true);
        Assert.Equal(3, _db.Events.Count(e => e.Title == "Série renommée"));

        await _service.DeleteAsync(created.Id, _userId, applyToSeries: true);
        Assert.Equal(0, _db.Events.Count(e => e.Title == "Série renommée"));
    }

    [Fact]
    public async Task ListAsync_HidesPastEvents_ButKeepsThemForMine()
    {
        var past = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Course du mois dernier",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(-30),
            MaxParticipants = 5,
            CreatorId = _userId,
            ActivityId = _activityId,
        };
        past.Participants.Add(new EventParticipant { UserId = _userId, Status = ParticipantStatus.Confirmed });
        _db.Events.Add(past);

        var upcoming = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Course de samedi",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(3),
            MaxParticipants = 5,
            CreatorId = _userId,
            ActivityId = _activityId,
        };
        upcoming.Participants.Add(new EventParticipant { UserId = _userId, Status = ParticipantStatus.Confirmed });
        _db.Events.Add(upcoming);
        await _db.SaveChangesAsync();

        var feed = await _service.ListAsync(null, null, null);
        Assert.DoesNotContain(feed.Items, e => e.Title == "Course du mois dernier");
        Assert.Contains(feed.Items, e => e.Title == "Course de samedi");

        // "Mes événements" keeps past occurrences — the mobile Messages tab
        // lists its chats from them.
        var mine = await _service.ListAsync(null, null, null, mine: true, userId: _userId);
        Assert.Contains(mine.Items, e => e.Title == "Course du mois dernier");
    }

    [Fact]
    public async Task JoinAsync_RefusesPastEvent()
    {
        var past = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Déjà passé",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(-2),
            MaxParticipants = 5,
            CreatorId = _userId,
            ActivityId = _activityId,
        };
        _db.Events.Add(past);
        await _db.SaveChangesAsync();

        var joiner = Guid.NewGuid();
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.JoinAsync(past.Id, joiner));
    }

    [Fact]
    public async Task ListAsync_FiltersByCategory()
    {
        var concertId = Guid.Parse("a1000000-0000-0000-0000-000000000016");
        _db.Activities.Add(new Activity { Id = concertId, Name = "Concert", Slug = "concert", Icon = "🎵", Category = "Culture" });
        await _db.SaveChangesAsync();

        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Footing", City = "Paris", Date = DateTime.UtcNow.AddDays(2), MaxParticipants = 5, ActivityId = _activityId
        });
        await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Jazz au caveau", City = "Paris", Date = DateTime.UtcNow.AddDays(3), MaxParticipants = 5, ActivityId = concertId
        });

        var culture = await _service.ListAsync(null, null, null, category: "Culture");
        Assert.Single(culture.Items);
        Assert.Equal("Jazz au caveau", culture.Items[0].Title);

        // The seeded test activity has the default category.
        var sport = await _service.ListAsync(null, null, null, category: "Sport");
        Assert.Single(sport.Items);
        Assert.Equal("Footing", sport.Items[0].Title);
    }

    [Fact]
    public async Task GetByIdAsync_WithholdsExactLocation_FromOutsiders()
    {
        var created = await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Apéro", City = "Paris", Location = "12 rue des Martyrs", Date = DateTime.UtcNow.AddDays(2),
            MaxParticipants = 6, ActivityId = _activityId, Latitude = 48.880123, Longitude = 2.337456
        });

        var anonymous = await _service.GetByIdAsync(created.Id);
        Assert.Null(anonymous.Location);
        Assert.True(anonymous.LocationHidden);
        Assert.Equal(48.88, anonymous.Latitude);
        Assert.Empty(anonymous.Participants);
        Assert.Equal(1, anonymous.ParticipantCount);

        var stranger = Guid.NewGuid();
        var signedIn = await _service.GetByIdAsync(created.Id, stranger);
        Assert.Null(signedIn.Location);
        Assert.Single(signedIn.Participants);

        var organiser = await _service.GetByIdAsync(created.Id, _userId);
        Assert.Equal("12 rue des Martyrs", organiser.Location);
        Assert.False(organiser.LocationHidden);
        Assert.Equal(48.880123, organiser.Latitude);
    }

    [Fact]
    public async Task JoinAsync_NotifiesCreator()
    {
        var created = await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Notif Event",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(3),
            MaxParticipants = 5,
            ActivityId = _activityId
        });

        var user2Id = Guid.NewGuid();
        _db.Users.Add(new AppUser
        {
            Id = user2Id,
            UserName = "n@test.com",
            Email = "n@test.com",
            FirstName = "Nina",
            City = "Paris",
            NormalizedEmail = "N@TEST.COM",
            NormalizedUserName = "N@TEST.COM",
            SecurityStamp = Guid.NewGuid().ToString()
        });
        await _db.SaveChangesAsync();

        await _service.JoinAsync(created.Id, user2Id);

        var notif = _db.Notifications.Single(n => n.UserId == _userId);
        Assert.Equal("participant_joined", notif.Type);
        Assert.Equal(created.Id, notif.EventId);
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

    [Fact]
    public async Task UpdateAsync_DateChange_NotifiesParticipants_AndRearmsReminder()
    {
        var memberId = Guid.NewGuid();
        _db.Users.Add(new AppUser
        {
            Id = memberId, UserName = "bob@test.com", Email = "bob@test.com", FirstName = "Bob", City = "Paris",
            NormalizedEmail = "BOB@TEST.COM", NormalizedUserName = "BOB@TEST.COM", SecurityStamp = Guid.NewGuid().ToString()
        });
        await _db.SaveChangesAsync();

        var created = await _service.CreateAsync(_userId, new CreateEventDto
        {
            Title = "Apéro", City = "Paris", Date = DateTime.UtcNow.AddDays(3), MaxParticipants = 5, ActivityId = _activityId
        });
        await _service.JoinAsync(created.Id, memberId);
        foreach (var p in _db.EventParticipants.Where(p => p.EventId == created.Id)) p.ReminderSentAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // A title-only edit is not a reschedule.
        await _service.UpdateAsync(created.Id, _userId, new UpdateEventDto { Title = "Apéro bis" });
        Assert.DoesNotContain(_db.Notifications, n => n.Type == "event_rescheduled");
        Assert.All(_db.EventParticipants.Where(p => p.EventId == created.Id), p => Assert.NotNull(p.ReminderSentAt));

        await _service.UpdateAsync(created.Id, _userId, new UpdateEventDto { Date = DateTime.UtcNow.AddDays(4) });

        var rescheduled = _db.Notifications.Where(n => n.Type == "event_rescheduled").ToList();
        Assert.Single(rescheduled);
        Assert.Equal(memberId, rescheduled[0].UserId);
        Assert.Contains("Apéro bis", rescheduled[0].Message);
        Assert.All(_db.EventParticipants.Where(p => p.EventId == created.Id), p => Assert.Null(p.ReminderSentAt));
    }

    public void Dispose() => _db.Dispose();
}
