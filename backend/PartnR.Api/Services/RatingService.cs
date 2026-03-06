using Microsoft.EntityFrameworkCore;
using PartnR.Api.Data;
using PartnR.Api.DTOs.Events;
using PartnR.Api.Entities;

namespace PartnR.Api.Services;

public class RatingService
{
    private readonly AppDbContext _db;

    public RatingService(AppDbContext db) => _db = db;

    public async Task<RatingDto> CreateAsync(Guid eventId, Guid raterId, CreateRatingDto dto)
    {
        var ev = await _db.Events.Include(e => e.Participants)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.Status != "Completed")
            throw new InvalidOperationException("Can only rate after event is completed.");

        if (raterId == dto.RatedUserId)
            throw new InvalidOperationException("Cannot rate yourself.");

        if (!ev.Participants.Any(p => p.UserId == raterId && p.Status == "Confirmed"))
            throw new InvalidOperationException("You did not participate in this event.");

        if (!ev.Participants.Any(p => p.UserId == dto.RatedUserId && p.Status == "Confirmed"))
            throw new InvalidOperationException("Rated user did not participate in this event.");

        var exists = await _db.Ratings.AnyAsync(r =>
            r.EventId == eventId && r.RaterId == raterId && r.RatedUserId == dto.RatedUserId);
        if (exists)
            throw new InvalidOperationException("Already rated this user for this event.");

        var rating = new Rating
        {
            EventId = eventId,
            RaterId = raterId,
            RatedUserId = dto.RatedUserId,
            Score = dto.Score,
            Comment = dto.Comment
        };

        _db.Ratings.Add(rating);
        await _db.SaveChangesAsync();

        // Update rated user's average
        var ratedUser = await _db.Users.FindAsync(dto.RatedUserId);
        if (ratedUser is not null)
        {
            var ratings = await _db.Ratings
                .Where(r => r.RatedUserId == dto.RatedUserId)
                .ToListAsync();
            ratedUser.RatingAvg = ratings.Average(r => r.Score);
            ratedUser.RatingCount = ratings.Count;
            await _db.SaveChangesAsync();
        }

        return new RatingDto
        {
            Id = rating.Id,
            EventId = rating.EventId,
            RaterId = rating.RaterId,
            RaterName = (await _db.Users.FindAsync(raterId))!.FirstName,
            RatedUserId = rating.RatedUserId,
            Score = rating.Score,
            Comment = rating.Comment,
            CreatedAt = rating.CreatedAt
        };
    }

    public async Task<List<RatingDto>> GetForUserAsync(Guid userId)
    {
        return await _db.Ratings
            .Include(r => r.Rater)
            .Where(r => r.RatedUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RatingDto
            {
                Id = r.Id,
                EventId = r.EventId,
                RaterId = r.RaterId,
                RaterName = r.Rater.FirstName,
                RatedUserId = r.RatedUserId,
                Score = r.Score,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }
}
