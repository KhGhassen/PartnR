using Microsoft.AspNetCore.Identity;

namespace PartnR.Domain.Entities;

public class AppUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string City { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public List<string> FavoriteActivities { get; set; } = [];
    public bool PhoneVerified { get; set; }
    public string Role { get; set; } = "user";
    public bool IsBanned { get; set; }
    public decimal RatingAvg { get; set; }
    public int RatingCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Event> CreatedEvents { get; set; } = [];
    public ICollection<EventParticipant> Participations { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
    public ICollection<Rating> RatingsGiven { get; set; } = [];
    public ICollection<Rating> RatingsReceived { get; set; } = [];
}
