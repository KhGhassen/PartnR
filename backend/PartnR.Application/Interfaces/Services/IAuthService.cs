using PartnR.Application.DTOs.Auth;

namespace PartnR.Application.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<UserInfoDto> GetCurrentUserAsync(Guid userId);
    Task ConfirmEmailAsync(string userId, string token);
    Task ResendConfirmationAsync(string email);
    Task ForgotPasswordAsync(string email);
    Task ResetPasswordAsync(string email, string token, string newPassword);
    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
}
