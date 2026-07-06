using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class StoredImageRepository : Repository<StoredImage>, IStoredImageRepository
{
    public StoredImageRepository(AppDbContext db) : base(db) { }
}
