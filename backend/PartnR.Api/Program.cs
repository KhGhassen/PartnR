using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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
        }
    };
});

builder.Services.AddAuthorization();

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;

    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
    });

    options.AddFixedWindowLimiter("api", opt =>
    {
        opt.PermitLimit = 60;
        opt.Window = TimeSpan.FromMinutes(1);
    });
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

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<EventChatHub>("/hubs/event-chat");

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
