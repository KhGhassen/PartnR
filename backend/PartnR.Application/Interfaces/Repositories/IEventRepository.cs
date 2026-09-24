using PartnR.Domain.Entities;

namespace PartnR.Application.Interfaces.Repositories;

public interface IEventRepository : IRepository<Event>
{
    /// <summary>
    /// Serialises seat allocation for one event for the rest of the current
    /// transaction. Must be called inside a transaction. No-op on providers
    /// without advisory locks (the InMemory test suite).
    /// </summary>
    Task LockAsync(Guid eventId);
}
