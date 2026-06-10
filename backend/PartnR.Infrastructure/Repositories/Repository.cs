using Microsoft.EntityFrameworkCore;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext Db;
    protected readonly DbSet<T> DbSet;

    public Repository(AppDbContext db)
    {
        Db = db;
        DbSet = db.Set<T>();
    }

    public IQueryable<T> Query() => DbSet.AsQueryable();

    public async Task<T?> FindAsync(params object[] keyValues) => await DbSet.FindAsync(keyValues);

    public void Add(T entity) => DbSet.Add(entity);

    public void Remove(T entity) => DbSet.Remove(entity);
}
