using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PartnR.Application.Common;
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
    private readonly INotificationRepository _notifications;
    private readonly IUserBlockRepository _blocks;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;
    private readonly string _frontendUrl;

    public EventService(
        IEventRepository events,
        IActivityRepository activities,
        IEventParticipantRepository participants,
        INotificationRepository notifications,
        IUserBlockRepository blocks,
        IUnitOfWork unitOfWork,
        IConfiguration config,
        IEmailService emailService)
    {
        _events = events;
        _activities = activities;
        _participants = participants;
        _notifications = notifications;
        _blocks = blocks;
        _unitOfWork = unitOfWork;
        _emailService = emailService;
        _frontendUrl = (config["FrontendUrl"] ?? "http://localhost:5173").TrimEnd('/');
    }

    // Both directions: the person I blocked and the person who blocked me.
    private Task<List<Guid>> HiddenUserIdsAsync(Guid userId) =>
        _blocks.Query()
            .Where(b => b.BlockerId == userId || b.BlockedId == userId)
            .Select(b => b.BlockerId == userId ? b.BlockedId : b.BlockerId)
            .ToListAsync();

    private Task<bool> IsBlockedEitherWayAsync(Guid a, Guid b) =>
        _blocks.Query().AnyAsync(x =>
            (x.BlockerId == a && x.BlockedId == b) || (x.BlockerId == b && x.BlockedId == a));

    public async Task<PaginatedResult<EventDto>> ListAsync(string? city, Guid? activityId, EventStatus? status, int page = 1, int pageSize = 20, bool mine = false, Guid? userId = null, double? lat = null, double? lng = null, double? radiusKm = null, string? search = null, string? category = null)
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

        if (userId.HasValue)
        {
            var hidden = await HiddenUserIdsAsync(userId.Value);
            if (hidden.Count > 0)
                query = query.Where(e => !hidden.Contains(e.CreatorId));
        }

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
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(e => e.Activity.Category == category);
        if (status.HasValue)
            query = query.Where(e => e.Status == status.Value);
        else
            query = query.Where(e => e.Status == EventStatus.Published);

        // The feed is a first impression: without this, page 1 leads with last
        // month's run, which people could still join. "mine" is exempt — the
        // mobile Messages tab finds its chats among past events.
        if (!mine && (status ?? EventStatus.Published) == EventStatus.Published)
        {
            var since = DateTime.UtcNow.AddHours(-6);
            query = query.Where(e => e.Date >= since);
        }

        // A recurring series shows a single card — its next upcoming
        // occurrence — everywhere upcoming events are listed. Past-status
        // views (Terminés/Annulés) keep each occurrence: they each happened.
        if ((status ?? EventStatus.Published) == EventStatus.Published)
        {
            var nowUtc = DateTime.UtcNow;
            query = query.Where(e => e.RecurrenceGroupId == null ||
                !_events.Query().Any(o =>
                    o.Id != e.Id &&
                    o.RecurrenceGroupId == e.RecurrenceGroupId &&
                    o.Status == EventStatus.Published &&
                    o.Date >= nowUtc &&
                    (e.Date < nowUtc || o.Date < e.Date)));
        }

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

        var occurrenceCounts = await CountUpcomingOccurrencesAsync(events);

        return new PaginatedResult<EventDto>
        {
            Items = events.Select(e => MapToDto(e, null,
                e.RecurrenceGroupId is { } g ? occurrenceCounts.GetValueOrDefault(g) : null)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    private async Task<Dictionary<Guid, int>> CountUpcomingOccurrencesAsync(List<Event> events)
    {
        var groupIds = events
            .Where(e => e.RecurrenceGroupId != null)
            .Select(e => e.RecurrenceGroupId!.Value)
            .Distinct()
            .ToList();
        if (groupIds.Count == 0) return [];

        var nowUtc = DateTime.UtcNow;
        return await _events.Query()
            .Where(e => e.RecurrenceGroupId != null && groupIds.Contains(e.RecurrenceGroupId.Value)
                        && e.Status == EventStatus.Published && e.Date >= nowUtc)
            .GroupBy(e => e.RecurrenceGroupId!.Value)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count);
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

    // Clients send an instant carrying its offset ("...Z" or "+02:00"); Npgsql
    // requires Kind=Utc for timestamptz. A value without an offset can only be
    // read as UTC — that is the legacy web contract, kept so old payloads do
    // not start throwing.
    private static DateTime ToUtc(DateTime value) =>
        value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();

    public async Task<EventDetailDto> GetByIdAsync(Guid id, Guid? viewerId = null)
    {
        var ev = await _events.Query()
            .Include(e => e.Activity)
            .Include(e => e.Creator)
            .Include(e => e.Participants).ThenInclude(p => p.User)
            .Include(e => e.Photos).ThenInclude(p => p.Uploader)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException("Event not found.");

        var occurrences = ev.RecurrenceGroupId is { } groupId
            ? await _events.Query()
                .Where(o => o.RecurrenceGroupId == groupId && o.Status == EventStatus.Published)
                .OrderBy(o => o.Date)
                .Select(o => new OccurrenceDto { Id = o.Id, Date = o.Date })
                .ToListAsync()
            : [];

        // GET /api/events/{id} is anonymous and used to return the exact address,
        // raw coordinates and the full roster. For an app that introduces
        // strangers, that is the dataset a stalker wants — and a GDPR problem.
        // Only the organiser and enrolled participants get the precise view.
        var isInsider = viewerId.HasValue &&
            (ev.CreatorId == viewerId.Value ||
             ev.Participants.Any(p => p.UserId == viewerId.Value && p.Status != ParticipantStatus.Cancelled));

        var dto = MapToDetailDto(ev, occurrences, isInsider, viewerId.HasValue);
        // The mobile app has no idea where the web app lives; the link it
        // shares must land on the public event page, whoever opens it.
        dto.ShareUrl = $"{_frontendUrl}/events/{ev.Id}";
        return dto;
    }

    public async Task<EventDetailDto> CreateAsync(Guid creatorId, CreateEventDto dto)
    {
        var activity = await _activities.FindAsync(dto.ActivityId)
            ?? throw new KeyNotFoundException("Activity not found.");

        var date = ToUtc(dto.Date);
        if (date < DateTime.UtcNow)
            throw new InvalidOperationException("Event date must be in the future.");

        var occurrences = dto.RecurrenceWeeks is > 1 ? dto.RecurrenceWeeks.Value : 1;
        var recurrenceGroupId = occurrences > 1 ? Guid.NewGuid() : (Guid?)null;
        Event first = null!;

        for (var i = 0; i < occurrences; i++)
        {
            var ev = new Event
            {
                Title = dto.Title,
                Description = dto.Description ?? string.Empty,
                City = dto.City,
                Location = dto.Location ?? string.Empty,
                Date = date.AddDays(7 * i),
                MaxParticipants = dto.MaxParticipants,
                ActivityId = dto.ActivityId,
                CreatorId = creatorId,
                Status = EventStatus.Published,
                PhotoUrl = dto.PhotoUrl,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                RecurrenceGroupId = recurrenceGroupId
            };

            ev.Participants.Add(new EventParticipant
            {
                UserId = creatorId,
                Status = ParticipantStatus.Confirmed
            });

            _events.Add(ev);
            first ??= ev;
        }

        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(first.Id, creatorId);
    }

    public async Task<EventDetailDto> UpdateAsync(Guid eventId, Guid userId, UpdateEventDto dto, bool applyToSeries = false)
    {
        var ev = await _events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.CreatorId != userId)
            throw new UnauthorizedAccessException("Only the creator can update this event.");

        var targets = new List<Event> { ev };
        if (applyToSeries && ev.RecurrenceGroupId is { } groupId)
        {
            var nowUtc = DateTime.UtcNow;
            targets.AddRange(await _events.Query()
                .Where(o => o.RecurrenceGroupId == groupId && o.Id != ev.Id && o.Date >= nowUtc)
                .ToListAsync());
        }

        var cancellationEmails = new List<(Event Ev, string Email, string FirstName)>();
        foreach (var target in targets)
        {
            if (dto.Title is not null) target.Title = dto.Title;
            if (dto.Description is not null) target.Description = dto.Description;
            if (dto.City is not null) target.City = dto.City;
            if (dto.Location is not null) target.Location = dto.Location;
            if (dto.MaxParticipants.HasValue) target.MaxParticipants = dto.MaxParticipants.Value;
            if (dto.Status.HasValue && dto.Status.Value == EventStatus.Cancelled && target.Status != EventStatus.Cancelled)
            {
                var affected = await _participants.Query()
                    .Include(p => p.User)
                    .Where(p => p.EventId == target.Id && p.Status == ParticipantStatus.Confirmed && p.UserId != userId)
                    .ToListAsync();
                foreach (var p in affected)
                {
                    _notifications.Add(new Notification
                    {
                        UserId = p.UserId,
                        Type = "event_cancelled",
                        Message = $"L'événement « {target.Title} » a été annulé.",
                        EventId = target.Id,
                    });
                    if (!string.IsNullOrEmpty(p.User?.Email))
                        cancellationEmails.Add((target, p.User.Email, p.User.FirstName));
                }
            }
            if (dto.Status.HasValue) target.Status = dto.Status.Value;
            if (dto.PhotoUrl is not null) target.PhotoUrl = dto.PhotoUrl;
            if (dto.Latitude.HasValue) target.Latitude = dto.Latitude;
            if (dto.Longitude.HasValue) target.Longitude = dto.Longitude;
        }

        // The date only ever applies to the edited occurrence — shifting a
        // whole series' dates at once would silently move everyone's plans.
        if (dto.Date.HasValue && ToUtc(dto.Date.Value) != ev.Date)
        {
            ev.Date = ToUtc(dto.Date.Value);

            // A reschedule is the one edit participants cannot afford to miss,
            // and the J-1 reminder must fire again for the new date.
            var confirmed = await _participants.Query()
                .Where(p => p.EventId == ev.Id && p.Status == ParticipantStatus.Confirmed)
                .ToListAsync();
            foreach (var p in confirmed)
            {
                p.ReminderSentAt = null;
                if (p.UserId == userId) continue;
                _notifications.Add(new Notification
                {
                    UserId = p.UserId,
                    Type = "event_rescheduled",
                    Message = $"« {ev.Title} » est déplacé au {FrenchDate.Long(ev.Date)}.",
                    EventId = ev.Id,
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();

        // A cancellation is the one news people plan their evening around, so
        // it goes by email too. After the save, best effort: the in-app and
        // push copies are already committed, and a mail outage must not turn
        // a successful cancellation into a 500 for the organiser.
        foreach (var (target, to, firstName) in cancellationEmails)
        {
            try
            {
                await _emailService.SendAsync(to,
                    $"Annulé — {target.Title}",
                    EmailTemplate.Render(
                        $"« {target.Title} » est annulé",
                        EmailTemplate.Paragraph($"Bonjour {EmailTemplate.Escape(firstName)}, l'organisateur a annulé la sortie prévue {FrenchDate.Long(target.Date)} à {EmailTemplate.Escape(target.City)}.")
                        + EmailTemplate.Paragraph("Désolé pour le contretemps. D'autres sorties vous attendent près de chez vous."),
                        "Trouver une autre sortie", $"{_frontendUrl}/events",
                        "Vous recevez cet email parce que vous étiez inscrit·e à cet événement."));
            }
            catch
            {
                // logged by the mail service; nothing to undo here
            }
        }

        return await GetByIdAsync(ev.Id, userId);
    }

    public async Task JoinAsync(Guid eventId, Guid userId)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            await _events.LockAsync(eventId);

            var ev = await _events.Query()
                .Include(e => e.Participants)
                .FirstOrDefaultAsync(e => e.Id == eventId)
                ?? throw new KeyNotFoundException("Event not found.");

            if (ev.Status != EventStatus.Published)
                throw new InvalidOperationException("Cannot join this event.");

            if (ev.Date < DateTime.UtcNow.AddHours(-6))
                throw new InvalidOperationException("Cet événement est déjà passé.");

            if (ev.Participants.Any(p => p.UserId == userId && p.Status != ParticipantStatus.Cancelled))
                throw new InvalidOperationException("Already participating.");

            // Same wording whichever side blocked: the block is never announced.
            if (ev.CreatorId != userId && await IsBlockedEitherWayAsync(userId, ev.CreatorId))
                throw new InvalidOperationException("Impossible de rejoindre cet événement.");

            var confirmed = ev.Participants.Count(p => p.Status == ParticipantStatus.Confirmed);
            var isFull = confirmed >= ev.MaxParticipants;
            var status = isFull ? ParticipantStatus.Waitlisted : ParticipantStatus.Confirmed;

            var existing = ev.Participants.FirstOrDefault(p => p.UserId == userId);
            if (existing is not null)
            {
                existing.Status = status;
                existing.JoinedAt = DateTime.UtcNow;
            }
            else
            {
                _participants.Add(new EventParticipant
                {
                    EventId = eventId,
                    UserId = userId,
                    Status = status
                });
            }

            if (ev.CreatorId != userId)
            {
                _notifications.Add(new Notification
                {
                    UserId = ev.CreatorId,
                    Type = isFull ? "participant_waitlisted" : "participant_joined",
                    Message = isFull
                        ? $"Quelqu'un s'est inscrit en liste d'attente de « {ev.Title} »."
                        : $"Un participant a rejoint « {ev.Title} » ({confirmed + 1}/{ev.MaxParticipants}).",
                    EventId = ev.Id,
                });
            }

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
        // Two departures used to promote the same waitlisted person and leave a
        // seat lost; the same lock as JoinAsync serialises the promotion.
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            await _events.LockAsync(eventId);
            await LeaveCoreAsync(eventId, userId);
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task LeaveCoreAsync(Guid eventId, Guid userId)
    {
        var participant = await _participants.Query()
            .FirstOrDefaultAsync(p => p.EventId == eventId && p.UserId == userId)
            ?? throw new KeyNotFoundException("Not a participant.");

        var ev = await _events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");
        if (ev.CreatorId == userId)
            throw new InvalidOperationException("Creator cannot leave. Cancel the event instead.");

        var wasConfirmed = participant.Status == ParticipantStatus.Confirmed;
        participant.Status = ParticipantStatus.Cancelled;
        _notifications.Add(new Notification
        {
            UserId = ev.CreatorId,
            Type = "participant_left",
            Message = $"Un participant a quitté « {ev.Title} ».",
            EventId = ev.Id,
        });

        // A confirmed spot opened up — promote the oldest waitlisted participant.
        if (wasConfirmed)
        {
            var promoted = await _participants.Query()
                .Where(p => p.EventId == eventId && p.Status == ParticipantStatus.Waitlisted)
                .OrderBy(p => p.JoinedAt)
                .FirstOrDefaultAsync();
            if (promoted is not null)
            {
                promoted.Status = ParticipantStatus.Confirmed;
                _notifications.Add(new Notification
                {
                    UserId = promoted.UserId,
                    Type = "waitlist_promoted",
                    Message = $"Une place s'est libérée : vous participez à « {ev.Title} » ! 🎉",
                    EventId = ev.Id,
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid eventId, Guid userId, bool applyToSeries = false)
    {
        var ev = await _events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (ev.CreatorId != userId)
            throw new UnauthorizedAccessException("Only the creator can delete this event.");

        _events.Remove(ev);

        if (applyToSeries && ev.RecurrenceGroupId is { } groupId)
        {
            var nowUtc = DateTime.UtcNow;
            var siblings = await _events.Query()
                .Where(o => o.RecurrenceGroupId == groupId && o.Id != ev.Id && o.Date >= nowUtc)
                .ToListAsync();
            foreach (var sibling in siblings) _events.Remove(sibling);
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private static EventDto MapToDto(Event e, double? distanceKm = null, int? upcomingOccurrences = null) => new()
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
        IsRecurring = e.RecurrenceGroupId != null,
        UpcomingOccurrences = upcomingOccurrences,
        CreatedAt = e.CreatedAt
    };

    private static EventDetailDto MapToDetailDto(Event e, List<OccurrenceDto>? occurrences = null, bool isInsider = true, bool isAuthenticated = true) => new()
    {
        Id = e.Id,
        Title = e.Title,
        Description = e.Description,
        City = e.City,
        Location = isInsider ? e.Location : null,
        LocationHidden = !isInsider && !string.IsNullOrEmpty(e.Location),
        Date = e.Date,
        MaxParticipants = e.MaxParticipants,
        Status = e.Status.ToString(),
        ActivityName = e.Activity.Name,
        ActivityIcon = e.Activity.Icon,
        CreatorId = e.CreatorId,
        CreatorName = e.Creator.FirstName,
        ParticipantCount = e.Participants.Count(p => p.Status == ParticipantStatus.Confirmed),
        PhotoUrl = e.PhotoUrl,
        // Two decimals ≈ 1 km: enough to place the pin in the neighbourhood,
        // not enough to find the doorstep.
        Latitude = isInsider ? e.Latitude : e.Latitude is { } lat ? Math.Round(lat, 2) : null,
        Longitude = isInsider ? e.Longitude : e.Longitude is { } lng ? Math.Round(lng, 2) : null,
        CreatedAt = e.CreatedAt,
        IsRecurring = e.RecurrenceGroupId != null,
        Occurrences = occurrences ?? [],
        // Anonymous visitors get the headcount only; signed-in members see who
        // is going — that is the trust signal before joining.
        Participants = (isAuthenticated ? e.Participants : []).Select(p => new ParticipantDto
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
