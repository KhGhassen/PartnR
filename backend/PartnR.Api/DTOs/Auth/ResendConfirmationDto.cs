using System.ComponentModel.DataAnnotations;

namespace PartnR.Api.DTOs.Auth;

public class ResendConfirmationDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = null!;
}
