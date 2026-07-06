using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PartnR.Domain.Entities;

namespace PartnR.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventParticipant> EventParticipants => Set<EventParticipant>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<EventPhoto> EventPhotos => Set<EventPhoto>();
    public DbSet<UserAction> UserActions => Set<UserAction>();
    public DbSet<StoredImage> StoredImages => Set<StoredImage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ── PROFILES (AppUser) ──────────────────────────────
        builder.Entity<AppUser>(e =>
        {
            e.Property(u => u.FirstName).HasMaxLength(50);
            e.Property(u => u.Bio).HasMaxLength(300);
            e.Property(u => u.City).HasMaxLength(100);
            e.Property(u => u.Role).HasMaxLength(10).HasDefaultValue("user");
            e.Property(u => u.IsBanned).HasDefaultValue(false);
            e.Property(u => u.RatingAvg).HasPrecision(3, 2);
            e.Property(u => u.FavoriteActivities).HasColumnType("text[]");
            e.Property(u => u.ProfileType)
                .HasConversion<string>()
                .HasMaxLength(20);
        });

        // ── ACTIVITIES ──────────────────────────────────────
        builder.Entity<Activity>(e =>
        {
            e.HasIndex(a => a.Slug).IsUnique();
            e.HasIndex(a => a.Name).IsUnique();
            e.Property(a => a.Name).HasMaxLength(50);
            e.Property(a => a.Slug).HasMaxLength(50);
            e.Property(a => a.Icon).HasMaxLength(10);

            e.HasData(
                new Activity { Id = Guid.Parse("a1000000-0000-0000-0000-000000000001"), Name = "Running", Slug = "running", Icon = "🏃" },
                new Activity { Id = Guid.Parse("a1000000-0000-0000-0000-000000000002"), Name = "Randonnée", Slug = "randonnee", Icon = "🥾" },
                new Activity { Id = Guid.Parse("a1000000-0000-0000-0000-000000000003"), Name = "Vélo", Slug = "velo", Icon = "🚴" },
                new Activity { Id = Guid.Parse("a1000000-0000-0000-0000-000000000004"), Name = "Jeux de société", Slug = "jeux-de-societe", Icon = "🎲" },
                new Activity { Id = Guid.Parse("a1000000-0000-0000-0000-000000000005"), Name = "Tennis", Slug = "tennis", Icon = "🎾" },
                new Activity { Id = Guid.Parse("a1000000-0000-0000-0000-000000000006"), Name = "Yoga", Slug = "yoga", Icon = "🧘" },
                new Activity { Id = Guid.Parse("a1000000-0000-0000-0000-000000000007"), Name = "Natation", Slug = "natation", Icon = "🏊" },
                new Activity { Id = Guid.Parse("a1000000-0000-0000-0000-000000000008"), Name = "Escalade", Slug = "escalade", Icon = "🧗" },
                new Activity { Id = Guid.Parse("a1000000-0000-0000-0000-000000000009"), Name = "Football", Slug = "football", Icon = "⚽" },
                new Activity { Id = Guid.Parse("a1000000-0000-0000-0000-000000000010"), Name = "Badminton", Slug = "badminton", Icon = "🏸" }
            );
        });

        // ── EVENTS ──────────────────────────────────────────
        builder.Entity<Event>(e =>
        {
            e.Property(ev => ev.Title).HasMaxLength(100);
            e.Property(ev => ev.Description).HasMaxLength(1000);
            e.Property(ev => ev.City).HasMaxLength(100);
            e.Property(ev => ev.Location).HasMaxLength(200);
            e.Property(ev => ev.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(EventStatus.Published);
            e.Property(ev => ev.PhotoUrl).HasMaxLength(500);

            e.HasIndex(ev => new { ev.City, ev.Date });
            e.HasIndex(ev => ev.ActivityId);
            e.HasIndex(ev => ev.Status);

            e.HasOne(ev => ev.Creator)
                .WithMany(u => u.CreatedEvents)
                .HasForeignKey(ev => ev.CreatorId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(ev => ev.Activity)
                .WithMany(a => a.Events)
                .HasForeignKey(ev => ev.ActivityId);
        });

        // ── EVENT_PARTICIPANTS ───────────────────────────────
        builder.Entity<EventParticipant>(e =>
        {
            e.HasIndex(ep => new { ep.EventId, ep.UserId }).IsUnique();

            e.Property(ep => ep.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(ParticipantStatus.Confirmed);

            e.HasOne(ep => ep.Event)
                .WithMany(ev => ev.Participants)
                .HasForeignKey(ep => ep.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(ep => ep.User)
                .WithMany(u => u.Participations)
                .HasForeignKey(ep => ep.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── MESSAGES ────────────────────────────────────────
        builder.Entity<Message>(e =>
        {
            e.Property(m => m.Content).HasMaxLength(2000);
            e.HasIndex(m => new { m.EventId, m.CreatedAt });

            e.HasOne(m => m.Event)
                .WithMany(ev => ev.Messages)
                .HasForeignKey(m => m.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(m => m.User)
                .WithMany(u => u.Messages)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── USER_ACTIONS ─────────────────────────────────────
        builder.Entity<UserAction>(e =>
        {
            e.Property(a => a.Action).HasMaxLength(50);
            e.Property(a => a.EntityType).HasMaxLength(50);
            e.Property(a => a.Metadata).HasMaxLength(500);
            e.HasIndex(a => new { a.UserId, a.CreatedAt });
            e.HasIndex(a => a.Action);
        });

        // ── RATINGS ─────────────────────────────────────────
        builder.Entity<Rating>(e =>
        {
            e.HasIndex(r => new { r.EventId, r.RaterId, r.RatedUserId }).IsUnique();
            e.HasIndex(r => r.RatedUserId);

            e.HasCheckConstraint("CK_Rating_NotSelf", "\"RaterId\" != \"RatedUserId\"");
            e.HasCheckConstraint("CK_Rating_Score", "\"Score\" >= 1 AND \"Score\" <= 5");

            e.Property(r => r.Comment).HasMaxLength(500);

            e.HasOne(r => r.Event)
                .WithMany(ev => ev.Ratings)
                .HasForeignKey(r => r.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.Rater)
                .WithMany(u => u.RatingsGiven)
                .HasForeignKey(r => r.RaterId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.Rated)
                .WithMany(u => u.RatingsReceived)
                .HasForeignKey(r => r.RatedUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── EVENT_PHOTOS ──────────────────────────────────────
        builder.Entity<EventPhoto>(e =>
        {
            e.Property(p => p.Url).HasMaxLength(500);
            e.HasIndex(p => p.EventId);

            e.HasOne(p => p.Event)
                .WithMany(ev => ev.Photos)
                .HasForeignKey(p => p.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(p => p.Uploader)
                .WithMany(u => u.UploadedPhotos)
                .HasForeignKey(p => p.UploaderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── STORED_IMAGES ─────────────────────────────────────
        builder.Entity<StoredImage>(e =>
        {
            e.Property(i => i.ContentType).HasMaxLength(50);
            e.HasIndex(i => i.UploaderId);
        });
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is AppUser user)
                user.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is Event evt)
                evt.UpdatedAt = DateTime.UtcNow;
        }
    }
}
