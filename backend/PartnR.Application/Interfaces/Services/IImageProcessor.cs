namespace PartnR.Application.Interfaces.Services;

public record ProcessedImage(byte[] Data, string ContentType);

public interface IImageProcessor
{
    /// <summary>
    /// Decodes, applies the EXIF orientation, drops every metadata block
    /// (EXIF/GPS, XMP, IPTC), bounds the longest side and re-encodes.
    /// Throws <see cref="ArgumentException"/> when the bytes are not a decodable image.
    /// </summary>
    ProcessedImage Normalize(byte[] data);
}
