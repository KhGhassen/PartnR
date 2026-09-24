using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PartnR.Api.Controllers;
using PartnR.Infrastructure.Data;
using Xunit;

namespace PartnR.Api.Tests;

public class HealthControllerTests
{
    [Fact]
    public async Task Ready_Returns200_WhenTheDatabaseAnswers()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using var db = new AppDbContext(options);
        var controller = new HealthController(db);

        var result = await controller.Ready(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    [Fact]
    public async Task Ready_Returns503_WhenTheDatabaseIsUnreachable()
    {
        // A PostgreSQL connection string pointing at a closed port: CanConnect
        // fails fast instead of hanging.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=127.0.0.1;Port=1;Database=x;Username=x;Password=x;Timeout=1")
            .Options;
        using var db = new AppDbContext(options);
        var controller = new HealthController(db);

        var result = await controller.Ready(CancellationToken.None);

        var degraded = Assert.IsType<ObjectResult>(result);
        Assert.Equal(503, degraded.StatusCode);
    }

    [Fact]
    public void Get_IsLivenessOnly()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using var db = new AppDbContext(options);

        var result = new HealthController(db).Get();

        Assert.IsType<OkObjectResult>(result);
    }
}
