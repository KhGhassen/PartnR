namespace PartnR.Api.DTOs.Analytics;

public class TrackActionDto
{
    public string Action { get; set; } = null!;
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? Metadata { get; set; }
}

public class DashboardDto
{
    public int TotalUsers { get; set; }
    public int TotalEvents { get; set; }
    public int TotalActions { get; set; }
    public int TodayActions { get; set; }
    public int NewUsersLast7Days { get; set; }
    public List<ActionByDayDto> ActionsByDay { get; set; } = [];
    public List<ActionByTypeDto> ActionsByType { get; set; } = [];
    public List<TopEventDto> TopEvents { get; set; } = [];
}

public class ActionByDayDto
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
}

public class ActionByTypeDto
{
    public string Action { get; set; } = null!;
    public int Count { get; set; }
}

public class TopEventDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string City { get; set; } = null!;
    public int ParticipantCount { get; set; }
}
