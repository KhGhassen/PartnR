using System.ComponentModel.DataAnnotations;

namespace PartnR.Application.DTOs.Auth;

public class ResendConfirmationDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = null!;
}
