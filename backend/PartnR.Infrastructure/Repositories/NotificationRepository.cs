using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(AppDbContext db) : base(db) { }
}
