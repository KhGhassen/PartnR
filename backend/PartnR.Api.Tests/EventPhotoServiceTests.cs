using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;
using PartnR.Infrastructure.Repositories;
using Xunit;

namespace PartnR.Api.Tests;

public class EventPhotoServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly EventPhotoService _photoService;
    private readonly Guid _creatorId = Guid.NewGuid();
    private readonly Guid _participantId = Guid.NewGuid();
    private readonly Guid _outsiderId = Guid.NewGuid();
    private readonly Guid _activityId = Guid.Parse("a1000000-0000-0000-0000-000000000001");
    private Guid _eventId;

    public EventPhotoServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _db = new AppDbContext(options);
        _photoService = new EventPhotoService(new EventRepository(_db), new EventPhotoRepository(_db), new UserRepository(_db), new UnitOfWork(_db));

        _db.Activities.Add(new Activity { Id = _activityId, Name = "Running", Slug = "running", Icon = "🏃" });
        _db.Users.AddRange(
            new AppUser
            {
                Id = _creatorId, UserName = "creator@test.com", Email = "creator@test.com",
                FirstName = "Alice", City = "Paris",
                NormalizedEmail = "CREATOR@TEST.COM", NormalizedUserName = "CREATOR@TEST.COM",
                SecurityStamp = Guid.NewGuid().ToString()
            },
            new AppUser
            {
                Id = _participantId, UserName = "participant@test.com", Email = "participant@test.com",
                FirstName = "Bob", City = "Paris",
                NormalizedEmail = "PARTICIPANT@TEST.COM", NormalizedUserName = "PARTICIPANT@TEST.COM",
                SecurityStamp = Guid.NewGuid().ToString()
            },
            new AppUser
            {
                Id = _outsiderId, UserName = "outsider@test.com", Email = "outsider@test.com",
                FirstName = "Eve", City = "Paris",
                NormalizedEmail = "OUTSIDER@TEST.COM", NormalizedUserName = "OUTSIDER@TEST.COM",
                SecurityStamp = Guid.NewGuid().ToString()
            }
        );
        _db.SaveChanges();

        var ev = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Past Run",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(-1),
            MaxParticipants = 10,
            ActivityId = _activityId,
            CreatorId = _creatorId,
            Status = EventStatus.Completed
        };
        ev.Participants.Add(new EventParticipant { UserId = _creatorId, Status = ParticipantStatus.Confirmed });
        ev.Participants.Add(new EventParticipant { UserId = _participantId, Status = ParticipantStatus.Confirmed });
        _db.Events.Add(ev);
        _db.SaveChanges();
        _eventId = ev.Id;
    }

    [Fact]
    public async Task AddAsync_ConfirmedParticipant_ReturnsDto()
    {
        var dto = new AddEventPhotoDto { Url = "https://example.com/photo.jpg" };
        var result = await _photoService.AddAsync(_eventId, _participantId, dto);

        Assert.Equal("https://example.com/photo.jpg", result.Url);
        Assert.Equal(_participantId, result.UploaderId);
        Assert.Equal("Bob", result.UploaderName);
    }

    [Fact]
    public async Task AddAsync_ThrowsWhenNotParticipant()
    {
        var dto = new AddEventPhotoDto { Url = "https://example.com/photo.jpg" };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _photoService.AddAsync(_eventId, _outsiderId, dto));
    }

    [Fact]
    public async Task DeleteAsync_Uploader_DeletesPhoto()
    {
        var dto = new AddEventPhotoDto { Url = "https://example.com/photo.jpg" };
        var photo = await _photoService.AddAsync(_eventId, _participantId, dto);

        await _photoService.DeleteAsync(_eventId, photo.Id, _participantId);

        Assert.False(await _db.EventPhotos.AnyAsync(p => p.Id == photo.Id));
    }

    [Fact]
    public async Task DeleteAsync_EventCreator_DeletesAnyPhoto()
    {
        var dto = new AddEventPhotoDto { Url = "https://example.com/photo.jpg" };
        var photo = await _photoService.AddAsync(_eventId, _participantId, dto);

        await _photoService.DeleteAsync(_eventId, photo.Id, _creatorId);

        Assert.False(await _db.EventPhotos.AnyAsync(p => p.Id == photo.Id));
    }

    [Fact]
    public async Task DeleteAsync_ThrowsForOtherUser()
    {
        var dto = new AddEventPhotoDto { Url = "https://example.com/photo.jpg" };
        var photo = await _photoService.AddAsync(_eventId, _participantId, dto);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _photoService.DeleteAsync(_eventId, photo.Id, _outsiderId));
    }

    public void Dispose() => _db.Dispose();
}
