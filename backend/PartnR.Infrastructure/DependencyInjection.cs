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
            // Login used CheckPasswordAsync, which never counts failures: with
            // the old global rate limit that was 14 400 guesses a day on one
            // account. Five misses lock the account for fifteen minutes.
            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
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
        services.AddScoped<IAccountService, AccountDeletionService>();
        services.AddSingleton<IAnalyticsTracker, AnalyticsTracker>();
        services.AddSingleton<IImageProcessor, ImageSharpProcessor>();

        return services;
    }
}
