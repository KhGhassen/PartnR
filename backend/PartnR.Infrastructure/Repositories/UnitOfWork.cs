using PartnR.Application.Interfaces.Repositories;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _db;

    public UnitOfWork(AppDbContext db) => _db = db;

    public Task<int> SaveChangesAsync() => _db.SaveChangesAsync();

    public async Task<ITransaction> BeginTransactionAsync()
        => new EfTransaction(await _db.Database.BeginTransactionAsync());
}
