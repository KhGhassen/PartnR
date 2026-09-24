using PartnR.Application.Common;
using PartnR.Application.DTOs.Events;
using Xunit;

namespace PartnR.Api.Tests;

public class IcsCalendarTests
{
    private static EventDetailDto Sample() => new()
    {
        Id = Guid.Parse("11111111-2222-3333-4444-555555555555"),
        Title = "Apéro; canal, puis resto",
        Description = "On se retrouve\nau bord de l'eau",
        City = "Paris",
        Location = "Quai de Valmy",
        Date = new DateTime(2026, 10, 3, 18, 30, 0, DateTimeKind.Utc),
        Latitude = 48.8721,
        Longitude = 2.3652,
        ShareUrl = "https://partnr.test/events/11111111-2222-3333-4444-555555555555",
    };

    [Fact]
    public void Build_ProducesAValidUtcEvent()
    {
        var ics = IcsCalendar.Build(Sample());
        var lines = ics.Split("\r\n");

        Assert.Equal("BEGIN:VCALENDAR", lines[0]);
        Assert.Contains("DTSTART:20261003T183000Z", lines);
        Assert.Contains("DTEND:20261003T203000Z", lines);
        Assert.Contains("UID:11111111-2222-3333-4444-555555555555@partnr", lines);
        Assert.Contains("GEO:48.8721;2.3652", lines);
        Assert.Contains("URL:https://partnr.test/events/11111111-2222-3333-4444-555555555555", lines);
        Assert.EndsWith("END:VCALENDAR\r\n", ics);
    }

    [Fact]
    public void Build_EscapesTextAndKeepsTheLinkInTheDescription()
    {
        var ics = IcsCalendar.Build(Sample());

        Assert.Contains("SUMMARY:Apéro\\; canal\\, puis resto", ics);
        Assert.Contains("LOCATION:Quai de Valmy\\, Paris", ics);
        Assert.Contains("DESCRIPTION:On se retrouve\\nau bord de l'eau\\nhttps://partnr.test", ics);
    }

    [Fact]
    public void Build_FoldsLongLines_At75Octets()
    {
        var e = Sample();
        e.Description = new string('é', 200);

        var ics = IcsCalendar.Build(e);

        foreach (var line in ics.Split("\r\n"))
            Assert.True(System.Text.Encoding.UTF8.GetByteCount(line) <= 75, $"line too long: {line.Length} chars");
        // Unfolding (removing CRLF + space) restores the original text.
        Assert.Contains(new string('é', 200), ics.Replace("\r\n ", ""));
    }

    [Fact]
    public void Build_OmitsLocationAndGeoWhenUnknown()
    {
        var e = Sample();
        e.Location = null;
        e.City = "";
        e.Latitude = null;

        var ics = IcsCalendar.Build(e);

        Assert.DoesNotContain("LOCATION:", ics);
        Assert.DoesNotContain("GEO:", ics);
    }

    [Theory]
    [InlineData("Apéro / canal: soirée!", "Apéro  canal soirée.ics")]
    [InlineData("!!!", "evenement.ics")]
    public void FileName_KeepsOnlySafeCharacters(string title, string expected)
    {
        Assert.Equal(expected, IcsCalendar.FileName(title));
    }
}
