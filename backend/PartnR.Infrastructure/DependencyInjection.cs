using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;
using PartnR.Infrastructure.Repositories;
using PartnR.Infrastructure.Services;

namespace PartnR.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddIdentity<AppUser, IdentityRole<Guid>>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireUppercase = true;
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IEventRepository, EventRepository>();
        services.AddScoped<IEventParticipantRepository, EventParticipantRepository>();
        services.AddScoped<IActivityRepository, ActivityRepository>();
        services.AddScoped<IRatingRepository, RatingRepository>();
        services.AddScoped<IEventPhotoRepository, EventPhotoRepository>();
        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<IUserActionRepository, UserActionRepository>();
        services.AddScoped<IStoredImageRepository, StoredImageRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IEventCommentRepository, EventCommentRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();

        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddSingleton<IAnalyticsTracker, AnalyticsTracker>();

        return services;
    }
}
