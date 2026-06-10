namespace PartnR.Application.Interfaces.Repositories;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync();
    Task<ITransaction> BeginTransactionAsync();
}
