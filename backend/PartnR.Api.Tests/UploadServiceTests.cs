using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PartnR.Application.Services;
using PartnR.Infrastructure.Data;
using PartnR.Infrastructure.Repositories;
using Xunit;

namespace PartnR.Api.Tests;

public class UploadServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly UploadService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public UploadServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _db = new AppDbContext(options);
        _service = new UploadService(new StoredImageRepository(_db), new UnitOfWork(_db));
    }

    [Fact]
    public async Task SaveImageAsync_StoresAndReturnsRetrievableImage()
    {
        var data = new byte[] { 1, 2, 3, 4 };

        var id = await _service.SaveImageAsync(_userId, data, "image/png");
        var stored = await _service.GetImageAsync(id);

        Assert.NotNull(stored);
        Assert.Equal(data, stored.Data);
        Assert.Equal("image/png", stored.ContentType);
    }

    [Fact]
    public async Task SaveImageAsync_RejectsUnsupportedContentType()
    {
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.SaveImageAsync(_userId, [1, 2, 3], "application/pdf"));
    }

    [Fact]
    public async Task SaveImageAsync_RejectsEmptyFile()
    {
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.SaveImageAsync(_userId, [], "image/jpeg"));
    }

    [Fact]
    public async Task SaveImageAsync_RejectsOversizedFile()
    {
        var tooBig = new byte[UploadService.MaxImageBytes + 1];

        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.SaveImageAsync(_userId, tooBig, "image/jpeg"));
    }

    [Fact]
    public async Task GetImageAsync_ReturnsNullForUnknownId()
    {
        var result = await _service.GetImageAsync(Guid.NewGuid());
        Assert.Null(result);
    }

    public void Dispose() => _db.Dispose();
}
