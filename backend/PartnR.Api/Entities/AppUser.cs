using Microsoft.AspNetCore.Identity;

namespace PartnR.Api.Entities;

/// <summary>
/// Utilisateur de la plateforme. Étend IdentityUser pour l'auth.
/// </summary>
public class AppUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string City { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;  // max 300 chars
    public List<string> FavoriteActivities { get; set; } = [];  // max 3
    public bool PhoneVerified { get; set; }
    public string Role { get; set; } = "user";  // "user" | "admin"
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
