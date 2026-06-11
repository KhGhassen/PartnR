using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class UserActionRepository : Repository<UserAction>, IUserActionRepository
{
    public UserActionRepository(AppDbContext db) : base(db) { }
}
