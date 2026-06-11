using PartnR.Application.DTOs.Events;

namespace PartnR.Application.Interfaces.Services;

public interface IRatingService
{
    Task<RatingDto> CreateAsync(Guid eventId, Guid raterId, CreateRatingDto dto);
    Task<List<RatingDto>> GetForUserAsync(Guid userId);
}
