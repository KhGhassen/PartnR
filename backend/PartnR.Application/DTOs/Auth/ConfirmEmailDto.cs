using System.ComponentModel.DataAnnotations;

namespace PartnR.Application.DTOs.Auth;

public class ConfirmEmailDto
{
    [Required]
    public string UserId { get; set; } = null!;

    [Required]
    public string Token { get; set; } = null!;
}
