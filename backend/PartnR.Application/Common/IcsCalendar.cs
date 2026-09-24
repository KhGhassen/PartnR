using System.Globalization;
using System.Text;
using PartnR.Application.DTOs.Events;

namespace PartnR.Application.Common;

// RFC 5545, the minimum every calendar app agrees on. Times are UTC ("Z"),
// so the calendar shows them in the device's zone.
public static class IcsCalendar
{
    private static readonly TimeSpan DefaultDuration = TimeSpan.FromHours(2);

    public static string Build(EventDetailDto e)
    {
        var start = DateTime.SpecifyKind(e.Date, DateTimeKind.Utc);
        var location = string.Join(", ", new[] { e.Location, e.City }.Where(s => !string.IsNullOrWhiteSpace(s)));
        var description = string.Join("\n", new[] { e.Description, e.ShareUrl }.Where(s => !string.IsNullOrWhiteSpace(s)));

        var lines = new List<string>
        {
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//PartnR//FR",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            $"UID:{e.Id}@partnr",
            $"DTSTAMP:{Stamp(DateTime.UtcNow)}",
            $"DTSTART:{Stamp(start)}",
            $"DTEND:{Stamp(start + DefaultDuration)}",
            $"SUMMARY:{Escape(e.Title)}",
        };
        if (location.Length > 0) lines.Add($"LOCATION:{Escape(location)}");
        if (description.Length > 0) lines.Add($"DESCRIPTION:{Escape(description)}");
        if (e.Latitude is { } lat && e.Longitude is { } lng)
            lines.Add($"GEO:{lat.ToString(CultureInfo.InvariantCulture)};{lng.ToString(CultureInfo.InvariantCulture)}");
        if (!string.IsNullOrEmpty(e.ShareUrl)) lines.Add($"URL:{e.ShareUrl}");
        lines.Add("END:VEVENT");
        lines.Add("END:VCALENDAR");

        return string.Join("\r\n", lines.Select(Fold)) + "\r\n";
    }

    public static string FileName(string title)
    {
        var safe = new string(title.Where(c => char.IsLetterOrDigit(c) || c is ' ' or '-' or '_').ToArray()).Trim();
        return (safe.Length > 0 ? safe : "evenement") + ".ics";
    }

    private static string Stamp(DateTime utc) => utc.ToString("yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture);

    private static string Escape(string s) => s
        .Replace("\\", "\\\\")
        .Replace(";", "\\;")
        .Replace(",", "\\,")
        .Replace("\r\n", "\\n")
        .Replace("\n", "\\n");

    // Content lines are limited to 75 octets; continuation lines start with a space.
    private static string Fold(string line)
    {
        var bytes = Encoding.UTF8.GetByteCount(line);
        if (bytes <= 75) return line;

        var sb = new StringBuilder();
        var current = new StringBuilder();
        var currentBytes = 0;
        foreach (var rune in line.EnumerateRunes())
        {
            var size = rune.Utf8SequenceLength;
            var limit = sb.Length == 0 ? 75 : 74;
            if (currentBytes + size > limit)
            {
                sb.Append(current).Append("\r\n ");
                current.Clear();
                currentBytes = 0;
            }
            current.Append(rune.ToString());
            currentBytes += size;
        }
        sb.Append(current);
        return sb.ToString();
    }
}
