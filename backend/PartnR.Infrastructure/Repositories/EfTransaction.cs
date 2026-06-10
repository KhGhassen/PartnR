using Microsoft.EntityFrameworkCore.Storage;
using PartnR.Application.Interfaces.Repositories;

namespace PartnR.Infrastructure.Repositories;

public class EfTransaction : ITransaction
{
    private readonly IDbContextTransaction _transaction;

    public EfTransaction(IDbContextTransaction transaction) => _transaction = transaction;

    public Task CommitAsync() => _transaction.CommitAsync();

    public Task RollbackAsync() => _transaction.RollbackAsync();

    public ValueTask DisposeAsync() => _transaction.DisposeAsync();
}
