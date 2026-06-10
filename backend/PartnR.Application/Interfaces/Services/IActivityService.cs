using PartnR.Application.DTOs.Activities;

namespace PartnR.Application.Interfaces.Services;

public interface IActivityService
{
    Task<List<ActivityDto>> ListAsync();
}
