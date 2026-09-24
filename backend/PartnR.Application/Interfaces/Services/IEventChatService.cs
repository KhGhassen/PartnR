using PartnR.Application.DTOs.Chat;

namespace PartnR.Application.Interfaces.Services;

public interface IEventChatService
{
    Task EnsureParticipantAsync(Guid eventId, Guid userId);
    /// <param name="viewerId">Messages exchanged with someone the viewer blocked, or who blocked them, are left out.</param>
    Task<List<ChatMessageDto>> GetHistoryAsync(Guid eventId, Guid viewerId, int take = 100);
    Task<ChatMessageDto?> SendMessageAsync(Guid eventId, Guid userId, string content);
}
