namespace PartnR.Application.Interfaces.Services;

public interface IAnalyticsTracker
{
    void Track(Guid? userId, string action, string? entityType = null, Guid? entityId = null, string? metadata = null);
}
