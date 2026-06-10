using Microsoft.EntityFrameworkCore;
using PartnR.Application.DTOs.Activities;
using PartnR.Application.Interfaces.Repositories;
using PartnR.Application.Interfaces.Services;

namespace PartnR.Application.Services;

public class ActivityService : IActivityService
{
    private readonly IActivityRepository _activities;

    public ActivityService(IActivityRepository activities) => _activities = activities;

    public async Task<List<ActivityDto>> ListAsync()
    {
        return await _activities.Query()
            .OrderBy(a => a.Name)
            .Select(a => new ActivityDto { Id = a.Id, Name = a.Name, Slug = a.Slug, Icon = a.Icon })
            .ToListAsync();
    }
}
