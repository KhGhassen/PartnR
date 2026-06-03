using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.IdentityModel.Tokens;
using PartnR.Api.DTOs.Auth;
using PartnR.Api.Entities;

namespace PartnR.Api.Services;

public class AuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;

    public AuthService(UserManager<AppUser> userManager, IConfiguration config, IEmailService emailService)
    {
        _userManager = userManager;
        _config = config;
        _emailService = emailService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var user = new AppUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FirstName = dto.FirstName,
            City = dto.City
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }

        await SendEmailConfirmationAsync(user);

        return GenerateResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        var valid = await _userManager.CheckPasswordAsync(user, dto.Password);
        if (!valid)
            throw new UnauthorizedAccessException("Invalid credentials.");

        return GenerateResponse(user);
    }

    public async Task ConfirmEmailAsync(string userId, string token)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var decoded = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
        var result = await _userManager.ConfirmEmailAsync(user, decoded);

        if (!result.Succeeded)
            throw new InvalidOperationException("Invalid or expired confirmation link.");
    }

    public async Task ResendConfirmationAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null || user.EmailConfirmed) return;
        await SendEmailConfirmationAsync(user);
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null) return; // don't reveal whether the account exists

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:5173";
        var link = $"{frontendUrl}/reset-password?email={Uri.EscapeDataString(email)}&token={encoded}";

        await _emailService.SendAsync(email,
            "Réinitialisation de mot de passe — PartnR",
            EmailBody.ResetPassword(user.FirstName, link));
    }

    public async Task ResetPasswordAsync(string email, string token, string newPassword)
    {
        var user = await _userManager.FindByEmailAsync(email)
            ?? throw new InvalidOperationException("Invalid request.");

        var decoded = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
        var result = await _userManager.ResetPasswordAsync(user, decoded, newPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }
    }

    public async Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new KeyNotFoundException("User not found.");

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }
    }

    public AuthResponseDto GenerateResponse(AppUser user)
    {
        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var expires = DateTime.UtcNow.AddMinutes(double.Parse(jwt["ExpireMinutes"]!));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.FirstName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new AuthResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expires,
            User = new UserInfoDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                Email = user.Email!,
                AvatarUrl = user.AvatarUrl,
                City = user.City,
                EmailConfirmed = user.EmailConfirmed
            }
        };
    }

    private async Task SendEmailConfirmationAsync(AppUser user)
    {
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:5173";
        var link = $"{frontendUrl}/verify-email?userId={user.Id}&token={encoded}";

        await _emailService.SendAsync(user.Email!,
            "Confirmez votre adresse email — PartnR",
            EmailBody.Confirmation(user.FirstName, link));
    }
}

internal static class EmailBody
{
    internal static string Confirmation(string firstName, string link) => $"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 16px">
          <h2 style="color:#4F46E5">Bienvenue sur PartnR, {firstName} !</h2>
          <p style="color:#374151">Cliquez sur le bouton ci-dessous pour confirmer votre adresse email :</p>
          <a href="{link}"
             style="display:inline-block;background:#4F46E5;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
            Confirmer mon email
          </a>
          <p style="color:#9CA3AF;font-size:13px">Ce lien expire dans 24&nbsp;heures.<br>Si vous n'avez pas créé de compte, ignorez cet email.</p>
        </div>
        """;

    internal static string ResetPassword(string firstName, string link) => $"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 16px">
          <h2 style="color:#4F46E5">Réinitialisation de mot de passe</h2>
          <p style="color:#374151">Bonjour {firstName}, vous avez demandé à réinitialiser votre mot de passe.</p>
          <a href="{link}"
             style="display:inline-block;background:#4F46E5;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
            Réinitialiser mon mot de passe
          </a>
          <p style="color:#9CA3AF;font-size:13px">Ce lien expire dans 1&nbsp;heure.<br>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        </div>
        """;
}
