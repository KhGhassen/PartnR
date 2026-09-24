using Microsoft.EntityFrameworkCore;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Constants;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

// Cities can be any French commune (geo.api.gouv.fr autocomplete), so a
// fixed list of twenty makes the filter blind to a Rouen apéro. Cities that
// actually have something coming up lead; the reference list follows so the
// picker is never empty on a fresh database.
public class CityService : ICityService
{
    private readonly IEventRepository _events;

    public CityService(IEventRepository events) => _events = events;

    public async Task<List<string>> ListAsync()
    {
        var since = DateTime.UtcNow.AddHours(-6);
        var active = await _events.Query()
            .Where(e => e.Status == EventStatus.Published && e.Date >= since)
            .GroupBy(e => e.City)
            .Select(g => new { City = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ThenBy(x => x.City)
            .Select(x => x.City)
            .ToListAsync();

        var seen = new HashSet<string>(active, StringComparer.OrdinalIgnoreCase);
        return active.Concat(FrenchCities.All.Where(seen.Add)).ToList();
    }
}
