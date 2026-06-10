namespace PartnR.Api.DTOs.Admin;

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string City { get; set; } = null!;
    public string Role { get; set; } = "user";
    public bool IsBanned { get; set; }
    public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
}
