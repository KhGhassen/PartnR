using PartnR.Application.DTOs.Analytics;

namespace PartnR.Application.Interfaces.Services;

public interface IAnalyticsService
{
    Task<DashboardDto> GetDashboardAsync(Guid requestingUserId);
}
