namespace PartnR.Application.Interfaces.Repositories;

public interface ITransaction : IAsyncDisposable
{
    Task CommitAsync();
    Task RollbackAsync();
}
