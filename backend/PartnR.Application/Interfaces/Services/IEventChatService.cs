using PartnR.Application.DTOs.Chat;

namespace PartnR.Application.Interfaces.Services;

public interface IEventChatService
{
    Task EnsureParticipantAsync(Guid eventId, Guid userId);
    Task<List<ChatMessageDto>> GetHistoryAsync(Guid eventId, int take = 100);
    Task<ChatMessageDto?> SendMessageAsync(Guid eventId, Guid userId, string content);
}
