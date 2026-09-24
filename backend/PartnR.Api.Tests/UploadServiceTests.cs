using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PartnR.Application.Interfaces.Services;
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
        _service = new UploadService(new StoredImageRepository(_db), new UnitOfWork(_db), new PassthroughProcessor());
    }

    // The real pipeline is covered by ImageProcessorTests; here the service's
    // own rules (size, sniffing, persistence) are what is under test.
    private sealed class PassthroughProcessor : IImageProcessor
    {
        public ProcessedImage Normalize(byte[] data) =>
            new(data, UploadService.DetectImageType(data) ?? "application/octet-stream");
    }

    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3];
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0];

    [Fact]
    public async Task SaveImageAsync_DetectsTypeFromBytes()
    {
        var id = await _service.SaveImageAsync(_userId, Png);
        var stored = await _service.GetImageAsync(id);

        Assert.NotNull(stored);
        Assert.Equal(Png, stored.Data);
        Assert.Equal("image/png", stored.ContentType);
    }

    [Fact]
    public async Task SaveImageAsync_RejectsNonImageBytes_WhateverTheClientClaims()
    {
        // "%PDF-1.4" — a real PDF header sent as image/png used to be stored and
        // re-served as image/png with a one-year cache.
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.SaveImageAsync(_userId, "%PDF-1.4 fake"u8.ToArray()));
    }

    [Fact]
    public async Task SaveImageAsync_RejectsEmptyFile()
    {
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.SaveImageAsync(_userId, []));
    }

    [Fact]
    public async Task SaveImageAsync_RejectsOversizedFile()
    {
        var tooBig = new byte[UploadService.MaxImageBytes + 1];
        Jpeg.CopyTo(tooBig, 0);

        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.SaveImageAsync(_userId, tooBig));
    }

    [Fact]
    public async Task GetImageAsync_ReturnsNullForUnknownId()
    {
        var result = await _service.GetImageAsync(Guid.NewGuid());
        Assert.Null(result);
    }

    public void Dispose() => _db.Dispose();
}
