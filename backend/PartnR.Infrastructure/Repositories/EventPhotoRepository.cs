using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class EventPhotoRepository : Repository<EventPhoto>, IEventPhotoRepository
{
    public EventPhotoRepository(AppDbContext db) : base(db) { }
}
