namespace PartnR.Api.DTOs.Profiles;

public class ProfileDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string City { get; set; } = null!;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public List<string> FavoriteActivities { get; set; } = [];
    public double RatingAvg { get; set; }
    public int RatingCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateProfileDto
{
    public string? FirstName { get; set; }
    public string? City { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public List<string>? FavoriteActivities { get; set; }
}
