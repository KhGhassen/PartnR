using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class EventParticipantRepository : Repository<EventParticipant>, IEventParticipantRepository
{
    public EventParticipantRepository(AppDbContext db) : base(db) { }
}
