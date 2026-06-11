using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class UserRepository : Repository<AppUser>, IUserRepository
{
    public UserRepository(AppDbContext db) : base(db) { }
}
