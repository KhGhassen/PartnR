using System.ComponentModel.DataAnnotations;

namespace PartnR.Api.DTOs.Auth;

public class RegisterDto
{
    [Required, MaxLength(50)]
    public string FirstName { get; set; } = null!;

    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    [Required, MinLength(8)]
    public string Password { get; set; } = null!;

    [Required, MaxLength(100)]
    public string City { get; set; } = null!;
}
