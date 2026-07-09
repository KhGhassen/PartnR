using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;
using PartnR.Infrastructure.Repositories;
using Xunit;

namespace PartnR.Api.Tests;

public class EventCommentServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly EventCommentService _service;
    private readonly Guid _creatorId = Guid.NewGuid();
    private readonly Guid _visitorId = Guid.NewGuid();
    private readonly Guid _eventId = Guid.NewGuid();

    public EventCommentServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _db = new AppDbContext(options);

        _db.Users.AddRange(
            MakeUser(_creatorId, "creator@test.com", "Alice"),
            MakeUser(_visitorId, "visitor@test.com", "Bob"));

        _db.Events.Add(new Event
        {
            Id = _eventId,
            Title = "Q&A Event",
            City = "Paris",
            Date = DateTime.UtcNow.AddDays(5),
            MaxParticipants = 5,
            CreatorId = _creatorId,
            ActivityId = Guid.Parse("a1000000-0000-0000-0000-000000000001"),
        });
        _db.SaveChanges();

        _service = new EventCommentService(
            new EventRepository(_db),
            new EventCommentRepository(_db),
            new UserRepository(_db),
            new NotificationRepository(_db),
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
    public async Task AddAsync_CreatesComment_AndNotifiesOrganizer()
    {
        var comment = await _service.AddAsync(_eventId, _visitorId, new AddEventCommentDto { Content = "Faut-il un vélo ?" });

        Assert.Equal("Faut-il un vélo ?", comment.Content);
        Assert.Equal("Bob", comment.UserName);
        Assert.False(comment.IsOrganizer);
        Assert.Contains(_db.Notifications, n => n.UserId == _creatorId && n.Type == "event_question");
    }

    [Fact]
    public async Task AddAsync_ByOrganizer_DoesNotSelfNotify_AndFlagsOrganizer()
    {
        var comment = await _service.AddAsync(_eventId, _creatorId, new AddEventCommentDto { Content = "Oui, prévoyez un vélo !" });

        Assert.True(comment.IsOrganizer);
        Assert.DoesNotContain(_db.Notifications, n => n.UserId == _creatorId);
    }

    [Fact]
    public async Task ListAsync_ReturnsCommentsInChronologicalOrder()
    {
        await _service.AddAsync(_eventId, _visitorId, new AddEventCommentDto { Content = "Première question" });
        await _service.AddAsync(_eventId, _creatorId, new AddEventCommentDto { Content = "Réponse" });

        var list = await _service.ListAsync(_eventId);

        Assert.Equal(2, list.Count);
        Assert.Equal("Première question", list[0].Content);
        Assert.Equal("Réponse", list[1].Content);
    }

    [Fact]
    public async Task DeleteAsync_RejectsThirdParty_AllowsOrganizer()
    {
        var comment = await _service.AddAsync(_eventId, _visitorId, new AddEventCommentDto { Content = "Spam" });

        var thirdPartyId = Guid.NewGuid();
        _db.Users.Add(MakeUser(thirdPartyId, "third@test.com", "Eve"));
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.DeleteAsync(_eventId, comment.Id, thirdPartyId));

        await _service.DeleteAsync(_eventId, comment.Id, _creatorId);
        Assert.Empty(await _service.ListAsync(_eventId));
    }

    public void Dispose() => _db.Dispose();
}
