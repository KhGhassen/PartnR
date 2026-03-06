namespace PartnR.Api.DTOs.Auth;

public class AuthResponseDto
{
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public UserInfoDto User { get; set; } = null!;
}

public class UserInfoDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public string City { get; set; } = null!;
}
