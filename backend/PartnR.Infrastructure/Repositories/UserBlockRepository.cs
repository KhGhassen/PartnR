using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class UserBlockRepository : Repository<UserBlock>, IUserBlockRepository
{
    public UserBlockRepository(AppDbContext db) : base(db) { }
}
