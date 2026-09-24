using PartnR.Application.Interfaces.Services;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;

namespace PartnR.Infrastructure.Services;

// Phone photos arrive at 4000 px with the GPS position of the shot in their
// EXIF block. Stored verbatim they bloated the database (images live in
// Postgres) and leaked exactly what the location-privacy rules withhold.
public sealed class ImageSharpProcessor : IImageProcessor
{
    public const int MaxSide = 1600;
    private const int JpegQuality = 82;

    public ProcessedImage Normalize(byte[] data)
    {
        Image image;
        try
        {
            image = Image.Load(data);
        }
        catch (Exception ex) when (ex is ImageFormatException or NotSupportedException)
        {
            throw new ArgumentException("Image illisible. Utilisez JPEG, PNG ou WebP.", ex);
        }

        using (image)
        {
            var formatName = image.Metadata.DecodedImageFormat?.Name ?? "";

            // Animated GIFs are kept as-is: re-encoding would flatten them, and
            // the format carries no EXIF to strip.
            if (string.Equals(formatName, "GIF", StringComparison.OrdinalIgnoreCase))
                return new ProcessedImage(data, "image/gif");

            // Orientation first: it is read from the EXIF block we then drop.
            image.Mutate(x => x.AutoOrient());
            if (image.Width > MaxSide || image.Height > MaxSide)
            {
                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(MaxSide, MaxSide),
                }));
            }

            image.Metadata.ExifProfile = null;
            image.Metadata.XmpProfile = null;
            image.Metadata.IptcProfile = null;

            using var ms = new MemoryStream();
            if (string.Equals(formatName, "PNG", StringComparison.OrdinalIgnoreCase))
            {
                // PNG keeps transparency (logos, stickers); photos go JPEG.
                image.Save(ms, new PngEncoder());
                return new ProcessedImage(ms.ToArray(), "image/png");
            }

            image.Save(ms, new JpegEncoder { Quality = JpegQuality });
            return new ProcessedImage(ms.ToArray(), "image/jpeg");
        }
    }
}
