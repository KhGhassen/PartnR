using System.ComponentModel.DataAnnotations;
using PartnR.Application.Validation;

namespace PartnR.Application.DTOs.Auth;

public class RegisterDto
{
    [Required, MaxLength(50)]
    public string FirstName { get; set; } = null!;

    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    [Required, MinLength(8)]
    public string Password { get; set; } = null!;

    [Required, MaxLength(100), AllowedCity]
    public string City { get; set; } = null!;
}
