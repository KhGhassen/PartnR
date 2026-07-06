using Microsoft.EntityFrameworkCore;
using PartnR.Application.DTOs;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class EventService : IEventService
{
    private readonly IEventRepository _events;
    private readonly IActivityRepository _activities;
    private readonly IEventParticipantRepository _participants;
    private readonly IUnitOfWork _unitOfWork;

    public EventService(
        IEventRepository events,
        IActivityRepository activities,
        IEventParticipantRepository participants,
        IUnitOfWork unitOfWork)
    {
        _events = events;
        _activities = activities;
        _participants = participants;
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedResult<EventDto>> ListAsync(string? city, Guid? activityId, EventStatus? status, int page = 1, int pageSize = 20, bool mine = false, Guid? userId = null, double? lat = null, double? lng = null, double? radiusKm = null, string? search = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _events.Query()
            .Include(e => e.Activity)
            .Include(e => e.Creator)
            .Include(e => e.Participants)
            .AsQueryable();

        if (mine && userId.HasValue)
            query = query.Where(e => e.Participants.Any(p => p.UserId == userId.Value && p.Status == ParticipantStatus.Confirmed));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(e =>
                e.Title.ToLower().Contains(term) ||
                (e.Description != null && e.Description.ToLower().Contains(term)) ||
                (e.Location != null && e.Location.ToLower().Contains(term)));
        }

        if (!string.IsNullOrEmpty(city))
            query = query.Where(e => e.City.ToLower() == city.ToLower());
        if (activityId.HasValue)
            query = query.Where(e => e.ActivityId == activityId.Value);
        if (status.HasValue)
            query = query.Where(e => e.Status == status.Value);
        else
            query = query.Where(e => e.Status == EventStatus.Published);

        if (lat.HasValue && lng.HasValue)
        {
            var radius = radiusKm ?? 25;

            var candidates = await query
                .Where(e => e.Latitude != null && e.Longitude != null)
                .ToListAsync();

            var nearby = candidates
                .Select(e => (Event: e, Distance: HaversineKm(lat.Value, lng.Value, e.Latitude!.Value, e.Longitude!.Value)))
                .Where(x => x.Distance <= radius)
                .OrderBy(x => x.Distance)
                .ToList();

            var nearTotal = nearby.Count;
            var nearPage = nearby.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return new PaginatedResult<EventDto>
            {
                Items = nearPage.Select(x => MapToDto(x.Event, x.Distance)).ToList(),
                TotalCount = nearTotal,
                Page = page,
                PageSize = pageSize
            };
        }

        var totalCount = await query.CountAsync();

        var events = await query
            .OrderBy(e => e.Date)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResult<EventDto>
        {
            Items = events.Select(e => MapToDto(e)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusKm = 6371;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;

    public async Task<EventDetailDto> GetByIdAsync(Guid id)
    {
        var ev = await _events.Query()
            .Include(e => e.Activity)
            .Include(e => e.Creator)
            .Include(e => e.Participants).ThenInclude(p => p.User)
            .Include(e => e.Photos).ThenInclude(p => p.Uploader)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException("Event not found.");

        return MapToDetailDto(ev);
    }

    public async Task<EventDetailDto> CreateAsync(Guid creatorId, CreateEventDto dto)
    {
        var activity = await _activities.FindAsync(dto.ActivityId)
            ?? throw new KeyNotFoundException("Activity not found.");

        var date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
        if (date < DateTime.UtcNow)
            throw new InvalidOperationException("Event date must be in the future.");

        var ev = new Event
        {
            Title = dto.Title,
            Description = dto.Description ?? string.Empty,
            City = dto.City,
            Location = dto.Location ?? string.Empty,
            Date = date,
            MaxParticipants = dto.MaxParticipants,
            ActivityId = dto.ActivityId,
            CreatorId = creatorId,
            Status = EventStatus.Published,
            PhotoUrl = dto.PhotoUrl,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude
        };

        ev.Participants.Add(new EventParticipant
        {
            UserId = creatorId,
            Status = ParticipantStatus.Confirmed
        });

        _events.Add(ev);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(ev.Id);
    }

    public async Task<EventDetailDto> UpdateAsync(Guid eventId, Guid userId, UpdateEventDto dto)
    {
        var ev = await _events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.CreatorId != userId)
            throw new UnauthorizedAccessException("Only the creator can update this event.");

        if (dto.Title is not null) ev.Title = dto.Title;
        if (dto.Description is not null) ev.Description = dto.Description;
        if (dto.City is not null) ev.City = dto.City;
        if (dto.Location is not null) ev.Location = dto.Location;
        if (dto.Date.HasValue) ev.Date = DateTime.SpecifyKind(dto.Date.Value, DateTimeKind.Utc);
        if (dto.MaxParticipants.HasValue) ev.MaxParticipants = dto.MaxParticipants.Value;
        if (dto.Status.HasValue) ev.Status = dto.Status.Value;
        if (dto.PhotoUrl is not null) ev.PhotoUrl = dto.PhotoUrl;
        if (dto.Latitude.HasValue) ev.Latitude = dto.Latitude;
        if (dto.Longitude.HasValue) ev.Longitude = dto.Longitude;

        await _unitOfWork.SaveChangesAsync();
        return await GetByIdAsync(ev.Id);
    }

    public async Task JoinAsync(Guid eventId, Guid userId)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var ev = await _events.Query()
                .Include(e => e.Participants)
                .FirstOrDefaultAsync(e => e.Id == eventId)
                ?? throw new KeyNotFoundException("Event not found.");

            if (ev.Status != EventStatus.Published)
                throw new InvalidOperationException("Cannot join this event.");

            var confirmed = ev.Participants.Count(p => p.Status == ParticipantStatus.Confirmed);
            if (confirmed >= ev.MaxParticipants)
                throw new InvalidOperationException("Event is full.");

            if (ev.Participants.Any(p => p.UserId == userId))
                throw new InvalidOperationException("Already participating.");

            _participants.Add(new EventParticipant
            {
                EventId = eventId,
                UserId = userId,
                Status = ParticipantStatus.Confirmed
            });

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task LeaveAsync(Guid eventId, Guid userId)
    {
        var participant = await _participants.Query()
            .FirstOrDefaultAsync(p => p.EventId == eventId && p.UserId == userId)
            ?? throw new KeyNotFoundException("Not a participant.");

        var ev = await _events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");
        if (ev.CreatorId == userId)
            throw new InvalidOperationException("Creator cannot leave. Cancel the event instead.");

        participant.Status = ParticipantStatus.Cancelled;
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid eventId, Guid userId)
    {
        var ev = await _events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.CreatorId != userId)
            throw new UnauthorizedAccessException("Only the creator can delete this event.");

        _events.Remove(ev);
        await _unitOfWork.SaveChangesAsync();
    }

    private static EventDto MapToDto(Event e, double? distanceKm = null) => new()
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
        PhotoUrl = e.PhotoUrl,
        Latitude = e.Latitude,
        Longitude = e.Longitude,
        DistanceKm = distanceKm,
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
        PhotoUrl = e.PhotoUrl,
        Latitude = e.Latitude,
        Longitude = e.Longitude,
        CreatedAt = e.CreatedAt,
        Participants = e.Participants.Select(p => new ParticipantDto
        {
            UserId = p.UserId,
            FirstName = p.User.FirstName,
            AvatarUrl = p.User.AvatarUrl,
            Status = p.Status.ToString(),
            JoinedAt = p.JoinedAt
        }).ToList(),
        Photos = e.Photos.OrderByDescending(p => p.CreatedAt).Select(p => new EventPhotoDto
        {
            Id = p.Id,
            EventId = p.EventId,
            Url = p.Url,
            UploaderId = p.UploaderId,
            UploaderName = p.Uploader.FirstName,
            CreatedAt = p.CreatedAt
        }).ToList()
    };
}
