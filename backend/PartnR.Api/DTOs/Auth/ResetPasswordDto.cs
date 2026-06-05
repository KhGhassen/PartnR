using System.ComponentModel.DataAnnotations;

namespace PartnR.Api.DTOs.Auth;

public class ResetPasswordDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Token { get; set; } = null!;

    [Required, MinLength(8)]
    public string NewPassword { get; set; } = null!;
}
