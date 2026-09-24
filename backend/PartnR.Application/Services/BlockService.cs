using Microsoft.EntityFrameworkCore;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

// Reporting hands a problem to an admin who may look at it next week. For an
// app that puts strangers in the same bar, the person being harassed needs
// something that works right now: blocking hides the pair from each other's
// feeds, joins and chats without anyone else being told.
public class BlockService : IBlockService
{
    private readonly IUserBlockRepository _blocks;
    private readonly IUserRepository _users;
    private readonly IEventRepository _events;
    private readonly IEventParticipantRepository _participants;
    private readonly IUnitOfWork _unitOfWork;

    public BlockService(
        IUserBlockRepository blocks,
        IUserRepository users,
        IEventRepository events,
        IEventParticipantRepository participants,
        IUnitOfWork unitOfWork)
    {
        _blocks = blocks;
        _users = users;
        _events = events;
        _participants = participants;
        _unitOfWork = unitOfWork;
    }

    public async Task BlockAsync(Guid userId, Guid targetId)
    {
        if (userId == targetId)
            throw new InvalidOperationException("Vous ne pouvez pas vous bloquer vous-même.");
        if (!await _users.Query().AnyAsync(u => u.Id == targetId))
            throw new KeyNotFoundException("Utilisateur introuvable.");

        var exists = await _blocks.Query().AnyAsync(b => b.BlockerId == userId && b.BlockedId == targetId);
        if (!exists)
            _blocks.Add(new UserBlock { BlockerId = userId, BlockedId = targetId });

        // The blocked person loses their seat in anything the blocker organises
        // from now on. Silently: the block itself is never announced.
        var nowUtc = DateTime.UtcNow;
        var seats = await _participants.Query()
            .Where(p => p.UserId == targetId
                        && p.Status != ParticipantStatus.Cancelled
                        && _events.Query().Any(e => e.Id == p.EventId && e.CreatorId == userId && e.Date >= nowUtc))
            .ToListAsync();
        foreach (var seat in seats) seat.Status = ParticipantStatus.Cancelled;

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UnblockAsync(Guid userId, Guid targetId)
    {
        var block = await _blocks.Query()
            .FirstOrDefaultAsync(b => b.BlockerId == userId && b.BlockedId == targetId);
        if (block is null) return;
        _blocks.Remove(block);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<List<BlockedUserDto>> ListAsync(Guid userId)
    {
        return await _blocks.Query()
            .Where(b => b.BlockerId == userId)
            .Join(_users.Query(), b => b.BlockedId, u => u.Id,
                (b, u) => new BlockedUserDto(u.Id, u.FirstName, u.AvatarUrl, b.CreatedAt))
            .OrderByDescending(x => x.BlockedAt)
            .ToListAsync();
    }
}
