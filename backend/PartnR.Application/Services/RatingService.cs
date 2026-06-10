using Microsoft.EntityFrameworkCore;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class RatingService : IRatingService
{
    private readonly IEventRepository _events;
    private readonly IRatingRepository _ratings;
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _unitOfWork;

    public RatingService(IEventRepository events, IRatingRepository ratings, IUserRepository users, IUnitOfWork unitOfWork)
    {
        _events = events;
        _ratings = ratings;
        _users = users;
        _unitOfWork = unitOfWork;
    }

    public async Task<RatingDto> CreateAsync(Guid eventId, Guid raterId, CreateRatingDto dto)
    {
        var ev = await _events.Query()
            .Include(e => e.Participants)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.Status != EventStatus.Completed)
            throw new InvalidOperationException("Can only rate after event is completed.");

        if (raterId == dto.RatedUserId)
            throw new InvalidOperationException("Cannot rate yourself.");

        if (!ev.Participants.Any(p => p.UserId == raterId && p.Status == ParticipantStatus.Confirmed))
            throw new InvalidOperationException("You did not participate in this event.");

        if (!ev.Participants.Any(p => p.UserId == dto.RatedUserId && p.Status == ParticipantStatus.Confirmed))
            throw new InvalidOperationException("Rated user did not participate in this event.");

        var exists = await _ratings.Query().AnyAsync(r =>
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

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            _ratings.Add(rating);
            await _unitOfWork.SaveChangesAsync();

            // Update rated user's average atomically
            var ratedUser = await _users.FindAsync(dto.RatedUserId);
            if (ratedUser is not null)
            {
                ratedUser.RatingAvg = await _ratings.Query()
                    .Where(r => r.RatedUserId == dto.RatedUserId)
                    .AverageAsync(r => (decimal)r.Score);
                ratedUser.RatingCount = await _ratings.Query()
                    .CountAsync(r => r.RatedUserId == dto.RatedUserId);
                await _unitOfWork.SaveChangesAsync();
            }

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        var rater = await _users.FindAsync(raterId);

        return new RatingDto
        {
            Id = rating.Id,
            EventId = rating.EventId,
            RaterId = rating.RaterId,
            RaterName = rater!.FirstName,
            RatedUserId = rating.RatedUserId,
            Score = rating.Score,
            Comment = rating.Comment,
            CreatedAt = rating.CreatedAt
        };
    }

    public async Task<List<RatingDto>> GetForUserAsync(Guid userId)
    {
        return await _ratings.Query()
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
