using Microsoft.EntityFrameworkCore;
using PartnR.Application.Services;
using PartnR.Domain.Constants;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;
using PartnR.Infrastructure.Repositories;
using Xunit;

namespace PartnR.Api.Tests;

public class CityServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly CityService _service;

    public CityServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _service = new CityService(new EventRepository(_db));
    }

    private void AddEvent(string city, DateTime date, EventStatus status = EventStatus.Published) =>
        _db.Events.Add(new Event
        {
            Title = "x", City = city, Date = date, MaxParticipants = 5, Status = status,
            CreatorId = Guid.NewGuid(), ActivityId = Guid.Parse("a1000000-0000-0000-0000-000000000001"),
        });

    [Fact]
    public async Task ListAsync_FallsBackToTheReferenceList_OnAnEmptyDatabase()
    {
        var cities = await _service.ListAsync();
        Assert.Equal(FrenchCities.All, cities);
    }

    [Fact]
    public async Task ListAsync_LeadsWithActiveCities_BusiestFirst_WithoutDuplicates()
    {
        var soon = DateTime.UtcNow.AddDays(2);
        AddEvent("Rouen", soon);
        AddEvent("Rouen", soon);
        AddEvent("Lyon", soon);
        AddEvent("Lille", DateTime.UtcNow.AddDays(-3));               // past
        AddEvent("Nice", soon, EventStatus.Cancelled);                // not published
        await _db.SaveChangesAsync();

        var cities = await _service.ListAsync();

        Assert.Equal(new[] { "Rouen", "Lyon" }, cities.Take(2));
        Assert.Equal(FrenchCities.All.Length + 1, cities.Count);   // Rouen added, Lyon not repeated
        Assert.Single(cities, c => c == "Lyon");
        Assert.Contains("Lille", cities);
    }

    public void Dispose() => _db.Dispose();
}
