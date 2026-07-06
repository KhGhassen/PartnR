using Microsoft.EntityFrameworkCore;

namespace PartnR.Infrastructure.Data;

/// <summary>
/// Applies the hand-written SQL migration files at startup. EnsureCreated() only
/// creates the schema on a brand-new database and never applies incremental
/// changes, which has repeatedly broken production when a migration file was
/// not run manually against Supabase.
/// </summary>
public static class SqlMigrationRunner
{
    // Legacy Supabase-native migrations, superseded by EnsureCreated(); recorded
    // as applied without being executed.
    private static readonly HashSet<string> Baseline =
    [
        "00001_initial_schema.sql",
        "00002_efcore_schema.sql",
        "00003_user_actions.sql",
    ];

    public static async Task<List<string>> ApplyAsync(AppDbContext db, string migrationsDir)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS "__PartnrMigrations" (
                "Name" text PRIMARY KEY,
                "AppliedAt" timestamp with time zone NOT NULL DEFAULT now()
            );
            """);

        var applied = (await db.Database
            .SqlQueryRaw<string>("SELECT \"Name\" AS \"Value\" FROM \"__PartnrMigrations\"")
            .ToListAsync()).ToHashSet();

        var executed = new List<string>();

        foreach (var path in Directory.GetFiles(migrationsDir, "*.sql").OrderBy(Path.GetFileName))
        {
            var name = Path.GetFileName(path);
            if (applied.Contains(name)) continue;

            if (!Baseline.Contains(name))
            {
                var sql = await File.ReadAllTextAsync(path);
                await using var tx = await db.Database.BeginTransactionAsync();
                await db.Database.ExecuteSqlRawAsync(sql);
                await db.Database.ExecuteSqlAsync($"INSERT INTO \"__PartnrMigrations\" (\"Name\") VALUES ({name})");
                await tx.CommitAsync();
                executed.Add(name);
            }
            else
            {
                await db.Database.ExecuteSqlAsync($"INSERT INTO \"__PartnrMigrations\" (\"Name\") VALUES ({name})");
            }
        }

        return executed;
    }
}
