using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PartnR.Api.Hubs;
using PartnR.Api.Middleware;
using PartnR.Application;
using PartnR.Infrastructure;
using PartnR.Infrastructure.Data;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/partnr-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14)
    .Enrich.FromLogContext()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

// Application + Infrastructure (DbContext, Identity, repositories, services)
builder.Services.AddApplication();
builder.Services.AddHostedService<PartnR.Api.Services.EventReminderService>();
builder.Services.AddHostedService<PartnR.Api.Services.ExpoPushService>();
builder.Services.AddHostedService<PartnR.Api.Services.EventLifecycleService>();
builder.Services.AddHttpClient();
builder.Services.AddInfrastructure(builder.Configuration);

// JWT
var jwtConfig = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtConfig["Key"];

// appsettings.json ships a placeholder that is a perfectly valid 48-char HS256
// key. Without this guard, a missing Jwt__Key means the API boots normally and
// signs tokens with a secret published on GitHub — anyone could forge an admin
// JWT. Outside Development this must be fatal, never a silent fallback.
if (!builder.Environment.IsDevelopment())
{
    if (string.IsNullOrWhiteSpace(jwtKey)
        || jwtKey.StartsWith("CHANGE_ME", StringComparison.Ordinal)
        || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    {
        throw new InvalidOperationException(
            "Jwt:Key is missing, too short (<32 bytes) or still the placeholder. " +
            "Set the Jwt__Key environment variable to a strong secret before starting the API.");
    }
}
else if (string.IsNullOrWhiteSpace(jwtKey))
{
    // Keep local runs frictionless, but never with a shared well-known secret.
    jwtKey = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48));
    builder.Configuration["Jwt:Key"] = jwtKey;
}

var key = Encoding.UTF8.GetBytes(jwtKey!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtConfig["Issuer"],
        ValidAudience = jwtConfig["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        // A JWT is self-contained, so a ban or a password change would only
        // take effect when it expires (24 h). Compare the stamp it carries
        // with the stored one, cached for a minute. Fails OPEN on a DB error:
        // a Supabase hiccup must not log everyone out.
        OnTokenValidated = async context =>
        {
            var sub = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                      ?? context.Principal?.FindFirst("sub")?.Value;
            if (!Guid.TryParse(sub, out var userId)) return;

            var tokenStamp = context.Principal?.FindFirst("sst")?.Value;
            var cache = context.HttpContext.RequestServices.GetRequiredService<IMemoryCache>();
            try
            {
                var state = await cache.GetOrCreateAsync($"sst:{userId}", async entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60);
                    var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                    return await db.Users.AsNoTracking()
                        .Where(u => u.Id == userId)
                        .Select(u => new { u.SecurityStamp, u.IsBanned })
                        .FirstOrDefaultAsync();
                });

                if (state is null || state.IsBanned)
                    context.Fail("Compte suspendu.");
                else if (tokenStamp is not null && !string.Equals(tokenStamp, state.SecurityStamp, StringComparison.Ordinal))
                    context.Fail("Session expirée.");
            }
            catch
            {
                // fail open
            }
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddMemoryCache();

// Rate limiting — partitioned. The previous fixed-window limiters were a
// single shared bucket: the eleventh visitor trying to log in within a minute
// got a 429, a free denial of service. Partitions are by client IP for
// anonymous traffic and by user id once authenticated; ForwardedHeaders
// below is what makes the IP meaningful behind Render's proxy.
static string ClientKey(HttpContext ctx)
{
    var userId = ctx.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                 ?? ctx.User?.FindFirst("sub")?.Value;
    if (!string.IsNullOrEmpty(userId)) return "u:" + userId;
    return "ip:" + (ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown");
}

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;

    options.AddPolicy("auth", ctx => RateLimitPartition.GetFixedWindowLimiter(
        "ip:" + (ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown"),
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));

    options.AddPolicy("api", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ClientKey(ctx),
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1) }));

    // Safety net for everything else, per client.
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ClientKey(ctx),
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 300, Window = TimeSpan.FromMinutes(1) }));
});

// Behind Render's proxy the connection IP is the proxy; trust exactly one
// X-Forwarded-For hop so partitions are per client, not one shared bucket.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.ForwardLimit = 1;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});

// SignalR
builder.Services.AddSignalR();

// Controllers + Swagger
builder.Services.AddControllers()
    .AddJsonOptions(opt => opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PartnR API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "JWT token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000", "http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.SetIsOriginAllowed(origin =>
            allowedOrigins.Contains(origin) ||
            new Uri(origin).Host.EndsWith(".vercel.app"))
              .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
              .AllowAnyHeader()
              .AllowCredentials());
});

var app = builder.Build();

// Schema bootstrap. Two failure modes that must NOT be conflated: a database
// that is temporarily unreachable (Supabase free tier pauses; Render starts
// before it wakes) is tolerated with a bounded retry, but a migration whose
// SQL fails is fatal — serving traffic on a half-migrated schema is worse than
// not starting, and the old single catch logged it as "not reachable".
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var reachable = false;
    for (var attempt = 1; attempt <= 5 && !reachable; attempt++)
    {
        try
        {
            if (db.Database.EnsureCreated())
                Log.Information("Database schema created");
            else
                Log.Information("Database connection verified — schema already exists");
            reachable = true;
        }
        catch (Exception ex)
        {
            var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt)); // 2, 4, 8, 16, 32 s
            Log.Warning(ex, "Database not reachable (attempt {Attempt}/5) — retrying in {Delay}s", attempt, delay.TotalSeconds);
            if (attempt < 5) await Task.Delay(delay);
        }
    }

    if (!reachable)
    {
        Log.Error("Database unreachable after 5 attempts — starting anyway; requests will fail until it is back");
    }
    else
    {
        var migrationsDir = Path.Combine(AppContext.BaseDirectory, "db-migrations");
        if (Directory.Exists(migrationsDir))
        {
            // No try/catch on purpose: an invalid migration takes the process down.
            var executed = await SqlMigrationRunner.ApplyAsync(db, migrationsDir);
            Log.Information(executed.Count > 0
                ? $"Applied SQL migrations: {string.Join(", ", executed)}"
                : "SQL migrations up to date");
        }
        else
        {
            Log.Error("SQL migrations directory missing from the build output ({Dir}) — schema may drift", migrationsDir);
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
// After authentication on purpose: the "api" partition keys on the user id.
app.UseRateLimiter();

app.MapControllers();
app.MapHub<EventChatHub>("/hubs/event-chat");

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
