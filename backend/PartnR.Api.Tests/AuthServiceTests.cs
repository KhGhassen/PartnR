using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PartnR.Application.DTOs.Auth;
using PartnR.Application.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;
using Xunit;

namespace PartnR.Api.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(Guid.NewGuid().ToString()));

        services.AddIdentity<AppUser, IdentityRole<Guid>>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireUppercase = true;
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestSecretKeyThatIsAtLeast32Characters!",
                ["Jwt:Issuer"] = "PartnR.Api.Test",
                ["Jwt:Audience"] = "PartnR.Client.Test",
                ["Jwt:ExpireMinutes"] = "60"
            })
            .Build();

        services.AddSingleton<IConfiguration>(config);
        services.AddLogging();

        _serviceProvider = services.BuildServiceProvider();
        var userManager = _serviceProvider.GetRequiredService<UserManager<AppUser>>();
        _service = new AuthService(userManager, config, new NoOpEmailService());
    }

    [Fact]
    public async Task RegisterAsync_CreatesUserAndReturnsToken()
    {
        var dto = new RegisterDto
        {
            FirstName = "Alice",
            Email = "alice@test.com",
            Password = "Password1!",
            City = "Paris"
        };

        var result = await _service.RegisterAsync(dto);

        Assert.NotNull(result.Token);
        Assert.Equal("Alice", result.User.FirstName);
        Assert.Equal("alice@test.com", result.User.Email);
        Assert.Equal("Paris", result.User.City);
        Assert.True(result.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task RegisterAsync_ThrowsOnDuplicateEmail()
    {
        var dto = new RegisterDto
        {
            FirstName = "Alice",
            Email = "dup@test.com",
            Password = "Password1!",
            City = "Paris"
        };

        await _service.RegisterAsync(dto);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.RegisterAsync(dto));
    }

    [Fact]
    public async Task LoginAsync_ReturnsTokenOnValidCredentials()
    {
        await _service.RegisterAsync(new RegisterDto
        {
            FirstName = "Bob",
            Email = "bob@test.com",
            Password = "Password1!",
            City = "Lyon"
        });

        var result = await _service.LoginAsync(new LoginDto
        {
            Email = "bob@test.com",
            Password = "Password1!"
        });

        Assert.NotNull(result.Token);
        Assert.Equal("Bob", result.User.FirstName);
    }

    [Fact]
    public async Task LoginAsync_ThrowsOnInvalidPassword()
    {
        await _service.RegisterAsync(new RegisterDto
        {
            FirstName = "Charlie",
            Email = "charlie@test.com",
            Password = "Password1!",
            City = "Lyon"
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.LoginAsync(new LoginDto
            {
                Email = "charlie@test.com",
                Password = "WrongPassword1!"
            }));
    }

    [Fact]
    public async Task LoginAsync_ThrowsOnNonExistentUser()
    {
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.LoginAsync(new LoginDto
            {
                Email = "nobody@test.com",
                Password = "Password1!"
            }));
    }

    public void Dispose() => _serviceProvider.Dispose();
}
