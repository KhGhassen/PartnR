using Microsoft.EntityFrameworkCore;
using PartnR.Application.DTOs.Events;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class EventPhotoService : IEventPhotoService
{
    private readonly IEventRepository _events;
    private readonly IEventPhotoRepository _photos;
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _unitOfWork;

    public EventPhotoService(IEventRepository events, IEventPhotoRepository photos, IUserRepository users, IUnitOfWork unitOfWork)
    {
        _events = events;
        _photos = photos;
        _users = users;
        _unitOfWork = unitOfWork;
    }

    public async Task<EventPhotoDto> AddAsync(Guid eventId, Guid uploaderId, AddEventPhotoDto dto)
    {
        var ev = await _events.Query()
            .Include(e => e.Participants)
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        if (!ev.Participants.Any(p => p.UserId == uploaderId && p.Status == ParticipantStatus.Confirmed))
            throw new InvalidOperationException("You did not participate in this event.");

        var photo = new EventPhoto
        {
            EventId = eventId,
            UploaderId = uploaderId,
            Url = dto.Url
        };

        _photos.Add(photo);
        await _unitOfWork.SaveChangesAsync();

        var uploader = await _users.FindAsync(uploaderId);

        return new EventPhotoDto
        {
            Id = photo.Id,
            EventId = photo.EventId,
            Url = photo.Url,
            UploaderId = photo.UploaderId,
            UploaderName = uploader!.FirstName,
            CreatedAt = photo.CreatedAt
        };
    }

    public async Task DeleteAsync(Guid eventId, Guid photoId, Guid userId)
    {
        var ev = await _events.FindAsync(eventId)
            ?? throw new KeyNotFoundException("Event not found.");

        var photo = await _photos.Query()
            .FirstOrDefaultAsync(p => p.Id == photoId && p.EventId == eventId)
            ?? throw new KeyNotFoundException("Photo not found.");

        if (photo.UploaderId != userId && ev.CreatorId != userId)
            throw new UnauthorizedAccessException("Only the uploader or event creator can delete this photo.");

        _photos.Remove(photo);
        await _unitOfWork.SaveChangesAsync();
    }
}
