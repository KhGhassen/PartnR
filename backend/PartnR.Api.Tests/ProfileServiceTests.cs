using Microsoft.EntityFrameworkCore;
using PartnR.Api.Data;
using PartnR.Api.DTOs.Profiles;
using PartnR.Api.Entities;
using PartnR.Api.Services;
using Xunit;

namespace PartnR.Api.Tests;

public class ProfileServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly ProfileService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public ProfileServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);

        _db.Users.Add(new AppUser
        {
            Id = _userId,
            UserName = "test@test.com",
            Email = "test@test.com",
            FirstName = "Alice",
            City = "Paris",
            Bio = "Hello",
            NormalizedEmail = "TEST@TEST.COM",
            NormalizedUserName = "TEST@TEST.COM",
            SecurityStamp = Guid.NewGuid().ToString()
        });
        _db.SaveChanges();

        _service = new ProfileService(_db);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsProfile()
    {
        var profile = await _service.GetByIdAsync(_userId);

        Assert.Equal("Alice", profile.FirstName);
        Assert.Equal("Paris", profile.City);
        Assert.Equal("Hello", profile.Bio);
    }

    [Fact]
    public async Task GetByIdAsync_ThrowsWhenNotFound()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _service.GetByIdAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task UpdateAsync_UpdatesFields()
    {
        var updated = await _service.UpdateAsync(_userId, new UpdateProfileDto
        {
            FirstName = "Bob",
            City = "Lyon"
        });

        Assert.Equal("Bob", updated.FirstName);
        Assert.Equal("Lyon", updated.City);
        Assert.Equal("Hello", updated.Bio); // unchanged
    }

    [Fact]
    public async Task SearchAsync_FiltersByCity()
    {
        // Add another user in a different city
        _db.Users.Add(new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = "bob@test.com",
            Email = "bob@test.com",
            FirstName = "Bob",
            City = "Lyon",
            NormalizedEmail = "BOB@TEST.COM",
            NormalizedUserName = "BOB@TEST.COM",
            SecurityStamp = Guid.NewGuid().ToString()
        });
        await _db.SaveChangesAsync();

        var results = await _service.SearchAsync("paris", null);

        Assert.Single(results);
        Assert.Equal("Alice", results[0].FirstName);
    }

    [Fact]
    public async Task SearchAsync_ReturnsEmpty_WhenNoMatch()
    {
        var results = await _service.SearchAsync("Marseille", null);

        Assert.Empty(results);
    }

    public void Dispose() => _db.Dispose();
}
