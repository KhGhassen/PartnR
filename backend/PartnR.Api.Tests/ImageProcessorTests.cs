using PartnR.Infrastructure.Services;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;
using SixLabors.ImageSharp.PixelFormats;
using Xunit;

namespace PartnR.Api.Tests;

public class ImageProcessorTests
{
    private readonly ImageSharpProcessor _processor = new();

    private static byte[] Jpeg(int width, int height, Action<ExifProfile>? exif = null)
    {
        using var image = new Image<Rgba32>(width, height, new Rgba32(200, 80, 40));
        if (exif is not null)
        {
            var profile = new ExifProfile();
            exif(profile);
            image.Metadata.ExifProfile = profile;
        }
        using var ms = new MemoryStream();
        image.Save(ms, new JpegEncoder());
        return ms.ToArray();
    }

    [Fact]
    public void Normalize_BoundsTheLongestSide_AndStripsExif()
    {
        var input = Jpeg(3200, 1600, p =>
        {
            p.SetValue(ExifTag.Software, "phone-camera");
            p.SetValue(ExifTag.GPSLatitude, new[] { new Rational(48), new Rational(52), new Rational(0) });
        });

        var result = _processor.Normalize(input);

        Assert.Equal("image/jpeg", result.ContentType);
        using var output = Image.Load(result.Data);
        Assert.Equal(ImageSharpProcessor.MaxSide, output.Width);
        Assert.Equal(ImageSharpProcessor.MaxSide / 2, output.Height);
        Assert.True(output.Metadata.ExifProfile is null || output.Metadata.ExifProfile.Values.Count == 0);
        Assert.True(result.Data.Length < input.Length);
    }

    [Fact]
    public void Normalize_KeepsSmallImagesAtTheirSize()
    {
        var result = _processor.Normalize(Jpeg(640, 480));

        using var output = Image.Load(result.Data);
        Assert.Equal(640, output.Width);
        Assert.Equal(480, output.Height);
    }

    [Fact]
    public void Normalize_AppliesExifOrientation()
    {
        // Orientation 6 = rotate 90° clockwise: a landscape shot stored sideways.
        var input = Jpeg(800, 400, p => p.SetValue(ExifTag.Orientation, (ushort)6));

        var result = _processor.Normalize(input);

        using var output = Image.Load(result.Data);
        Assert.Equal(400, output.Width);
        Assert.Equal(800, output.Height);
    }

    [Fact]
    public void Normalize_KeepsPngAsPng()
    {
        using var image = new Image<Rgba32>(100, 100);
        using var ms = new MemoryStream();
        image.Save(ms, new PngEncoder());

        var result = _processor.Normalize(ms.ToArray());

        Assert.Equal("image/png", result.ContentType);
    }

    [Fact]
    public void Normalize_RejectsBytesThatOnlyLookLikeAnImage()
    {
        // A JPEG magic number followed by garbage passes the sniff but not the decoder.
        byte[] fake = [0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3, 4, 5, 6, 7, 8];
        Assert.Throws<ArgumentException>(() => _processor.Normalize(fake));
    }
}
