namespace PartnR.Application.Interfaces.Services;

public record BlockedUserDto(Guid Id, string FirstName, string? AvatarUrl, DateTime BlockedAt);

public interface IBlockService
{
    /// <summary>Idempotent. Also drops the blocked user from the blocker's upcoming events.</summary>
    Task BlockAsync(Guid userId, Guid targetId);
    Task UnblockAsync(Guid userId, Guid targetId);
    Task<List<BlockedUserDto>> ListAsync(Guid userId);
}
