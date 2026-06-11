using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class RatingRepository : Repository<Rating>, IRatingRepository
{
    public RatingRepository(AppDbContext db) : base(db) { }
}
