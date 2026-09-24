namespace PartnR.Application.Interfaces.Services;

public interface ICityService
{
    /// <summary>Cities with upcoming events first (busiest first), then the reference list.</summary>
    Task<List<string>> ListAsync();
}
