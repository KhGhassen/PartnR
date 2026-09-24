using Microsoft.EntityFrameworkCore;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class EventRepository : Repository<Event>, IEventRepository
{
    public EventRepository(AppDbContext db) : base(db) { }

    // JoinAsync counted confirmed seats in memory under READ COMMITTED: two
    // simultaneous joins on the last seat both read Max-1 and both got in.
    // A transaction-scoped advisory lock keyed on the event id makes the
    // count-then-insert atomic without a denormalised counter that would drift.
    public async Task LockAsync(Guid eventId)
    {
        if (!Db.Database.IsNpgsql()) return;
        var key = eventId.ToString();
        await Db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtext({key}))");
    }
}
