using System.ComponentModel.DataAnnotations;

namespace PartnR.Api.DTOs.Auth;

public class ForgotPasswordDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = null!;
}
