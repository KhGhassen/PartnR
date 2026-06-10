using Microsoft.Extensions.DependencyInjection;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Services;

public class AnalyticsTracker : IAnalyticsTracker
{
    private readonly IServiceScopeFactory _scopeFactory;

    public AnalyticsTracker(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    public void Track(Guid? userId, string action, string? entityType = null, Guid? entityId = null, string? metadata = null)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.UserActions.Add(new UserAction
                {
                    UserId = userId,
                    Action = action,
                    EntityType = entityType,
                    EntityId = entityId,
                    Metadata = metadata
                });
                await db.SaveChangesAsync();
            }
            catch
            {
                // fire-and-forget: swallow errors to never block the request
            }
        });
    }
}
