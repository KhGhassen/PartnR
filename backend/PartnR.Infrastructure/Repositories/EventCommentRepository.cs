using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class EventCommentRepository : Repository<EventComment>, IEventCommentRepository
{
    public EventCommentRepository(AppDbContext db) : base(db) { }
}
