namespace PartnR.Application.Interfaces.Services;

public interface IAccountService
{
    /// <summary>Permanently deletes the caller's account and everything only they own.</summary>
    Task DeleteAsync(Guid userId);
}
