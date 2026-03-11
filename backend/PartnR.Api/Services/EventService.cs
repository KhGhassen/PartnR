using Microsoft.EntityFrameworkCore;
using PartnR.Api.Data;
using PartnR.Api.DTOs.Events;
using PartnR.Api.Entities;

namespace PartnR.Api.Services;

public class EventService
{
    private readonly AppDbContext _db;

    public EventService(AppDbContext db) => _db = db;

    public async Task<List<EventDto>> ListAsync(string? city, Guid? activityId, EventStatus? status)
    {
        var query = _db.Events
            .Include(e => e.Activity)
            .Include(e => e.Creator)
            .Include(e => e.Participants)
            .AsQueryable();

        if (!string.IsNullOrEmpty(city))
            query = query.Where(e => e.City.ToLower() == city.ToLower());
        if (activityId.HasValue)
            query = query.Where(e => e.ActivityId == activityId.Value);
        if (status.HasValue)
            query = query.Where(e => e.Status == status.Value);
        else
            query = query.Where(e => e.Status == EventStatus.Published);

        var events = await query.OrderBy(e => e.Date).Take(50).ToListAsync();
        return events.Select(MapToDto).ToList();
    }

    public async Task<EventDetailDto> GetByIdAsync(Guid id)
    {
        var ev = await _db.Events
            .Include(e => e.Activity)
            .Include(e => e.Creator)
            .Include(e => e.Participants).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException("Event not found.");

        return MapToDetailDto(ev);
    }

    public async Task<EventDetailDto> CreateAsync(Guid creatorId, CreateEventDto dto)
    {
        var activity = await _db.Activities.FindAsync(dto.ActivityId)
            ?? throw new KeyNotFoundException("Activity not found.");

        var ev = new Event
        {
            Title = dto.Title,
            Description = dto.Description ?? string.Empty,
            City = dto.City,
            Location = dto.Location ?? string.Empty,
            Date = dto.Date,
            MaxParticipants = dto.MaxParticipants,
            ActivityId = dto.ActivityId,
            CreatorId = creatorId,
            Status = EventStatus.Published
        };

        ev.Participants.Add(new EventParticipant
        {
            UserId = creatorId,
            Status = ParticipantStatus.Confirmed
        });

        _db.Events.Add(ev);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(ev.Id);
    }

    public async Task<EventDetailDto> UpdateAsync(Guid eventId, Guid userId, UpdateEventDto dto)
    {
        var ev = await _db.Events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.CreatorId != userId)
            throw new UnauthorizedAccessException("Only the creator can update this event.");

        if (dto.Title is not null) ev.Title = dto.Title;
        if (dto.Description is not null) ev.Description = dto.Description;
        if (dto.City is not null) ev.City = dto.City;
        if (dto.Location is not null) ev.Location = dto.Location;
        if (dto.Date.HasValue) ev.Date = dto.Date.Value;
        if (dto.MaxParticipants.HasValue) ev.MaxParticipants = dto.MaxParticipants.Value;
        if (dto.Status.HasValue) ev.Status = dto.Status.Value;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(ev.Id);
    }

    public async Task JoinAsync(Guid eventId, Guid userId)
    {
        var ev = await _db.Events.Include(e => e.Participants)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.Status != EventStatus.Published)
            throw new InvalidOperationException("Cannot join this event.");

        var confirmed = ev.Participants.Count(p => p.Status == ParticipantStatus.Confirmed);
        if (confirmed >= ev.MaxParticipants)
            throw new InvalidOperationException("Event is full.");

        if (ev.Participants.Any(p => p.UserId == userId))
            throw new InvalidOperationException("Already participating.");

        ev.Participants.Add(new EventParticipant
        {
            UserId = userId,
            Status = ParticipantStatus.Confirmed
        });

        await _db.SaveChangesAsync();
    }

    public async Task LeaveAsync(Guid eventId, Guid userId)
    {
        var participant = await _db.EventParticipants
            .FirstOrDefaultAsync(p => p.EventId == eventId && p.UserId == userId)
            ?? throw new KeyNotFoundException("Not a participant.");

        var ev = await _db.Events.FindAsync(eventId)!;
        if (ev!.CreatorId == userId)
            throw new InvalidOperationException("Creator cannot leave. Cancel the event instead.");

        participant.Status = ParticipantStatus.Cancelled;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid eventId, Guid userId)
    {
        var ev = await _db.Events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.CreatorId != userId)
            throw new UnauthorizedAccessException("Only the creator can delete this event.");

        _db.Events.Remove(ev);
        await _db.SaveChangesAsync();
    }

    private static EventDto MapToDto(Event e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        Description = e.Description,
        City = e.City,
        Location = e.Location,
        Date = e.Date,
        MaxParticipants = e.MaxParticipants,
        Status = e.Status.ToString(),
        ActivityName = e.Activity.Name,
        ActivityIcon = e.Activity.Icon,
        CreatorId = e.CreatorId,
        CreatorName = e.Creator.FirstName,
        ParticipantCount = e.Participants.Count(p => p.Status == ParticipantStatus.Confirmed),
        CreatedAt = e.CreatedAt
    };

    private static EventDetailDto MapToDetailDto(Event e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        Description = e.Description,
        City = e.City,
        Location = e.Location,
        Date = e.Date,
        MaxParticipants = e.MaxParticipants,
        Status = e.Status.ToString(),
        ActivityName = e.Activity.Name,
        ActivityIcon = e.Activity.Icon,
        CreatorId = e.CreatorId,
        CreatorName = e.Creator.FirstName,
        ParticipantCount = e.Participants.Count(p => p.Status == ParticipantStatus.Confirmed),
        CreatedAt = e.CreatedAt,
        Participants = e.Participants.Select(p => new ParticipantDto
        {
            UserId = p.UserId,
            FirstName = p.User.FirstName,
            AvatarUrl = p.User.AvatarUrl,
            Status = p.Status.ToString(),
            JoinedAt = p.JoinedAt
        }).ToList()
    };
}
