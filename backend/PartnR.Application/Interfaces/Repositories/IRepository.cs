namespace PartnR.Application.Interfaces.Repositories;

public interface IRepository<T> where T : class
{
    IQueryable<T> Query();
    Task<T?> FindAsync(params object[] keyValues);
    void Add(T entity);
    void Remove(T entity);
}
