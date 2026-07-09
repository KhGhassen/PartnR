using Microsoft.Extensions.DependencyInjection;
using PartnR.Application.Interfaces.Services;
using PartnR.Application.Services;

namespace PartnR.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IEventService, EventService>();
        services.AddScoped<IRatingService, RatingService>();
        services.AddScoped<IEventPhotoService, EventPhotoService>();
        services.AddScoped<IActivityService, ActivityService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IEventChatService, EventChatService>();
        services.AddScoped<IUploadService, UploadService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IEventCommentService, EventCommentService>();

        return services;
    }
}
