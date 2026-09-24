using System.Globalization;

namespace PartnR.Application.Common;

// Every date the API stores is UTC; every date it WRITES to a human (emails,
// notification text) must be Paris time — a 20:00 apéro was being announced
// as "à 18:00". Clients render their own dates; this is only for server-side
// prose.
public static class FrenchDate
{
    private static readonly CultureInfo Culture = new("fr-FR");
    private static readonly TimeZoneInfo Paris = ResolveParis();

    private static TimeZoneInfo ResolveParis()
    {
        foreach (var id in new[] { "Europe/Paris", "Romance Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }
        return TimeZoneInfo.Utc;
    }

    public static DateTime ToLocal(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), Paris);

    /// <summary>"jeudi 25 septembre à 19h30"</summary>
    public static string Long(DateTime utc) =>
        ToLocal(utc).ToString("dddd d MMMM 'à' HH'h'mm", Culture);

    /// <summary>"aujourd'hui à 19h30", "demain à 19h30", else the long form.</summary>
    public static string Relative(DateTime utc, DateTime nowUtc)
    {
        var local = ToLocal(utc);
        var today = ToLocal(nowUtc).Date;
        var day = local.Date == today ? "aujourd'hui"
            : local.Date == today.AddDays(1) ? "demain"
            : local.ToString("dddd d MMMM", Culture);
        return $"{day} à {local.ToString("HH'h'mm", Culture)}";
    }
}
