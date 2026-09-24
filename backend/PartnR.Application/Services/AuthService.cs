using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PartnR.Application.Common;
using PartnR.Application.DTOs.Auth;
using PartnR.Application.Interfaces.Services;
using PartnR.Domain.Entities;

namespace PartnR.Application.Services;

public class AuthService : IAuthService
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

        if (await _userManager.IsLockedOutAsync(user))
            throw new UnauthorizedAccessException("Trop de tentatives. Réessayez dans quelques minutes.");

        var valid = await _userManager.CheckPasswordAsync(user, dto.Password);
        if (!valid)
        {
            await _userManager.AccessFailedAsync(user);
            throw new UnauthorizedAccessException("Invalid credentials.");
        }
        await _userManager.ResetAccessFailedCountAsync(user);

        if (user.IsBanned)
            throw new UnauthorizedAccessException("Votre compte a été suspendu.");

        return GenerateResponse(user);
    }

    public async Task<UserInfoDto> GetCurrentUserAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new KeyNotFoundException("User not found.");

        return new UserInfoDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            Email = user.Email!,
            AvatarUrl = user.AvatarUrl,
            City = user.City,
            Role = user.Role,
            EmailConfirmed = user.EmailConfirmed
        };
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
            EmailTemplate.Render(
                "Réinitialiser votre mot de passe",
                EmailTemplate.Paragraph($"Bonjour {EmailTemplate.Escape(user.FirstName)}, vous avez demandé un nouveau mot de passe. Le lien ci-dessous est valable une heure."),
                "Choisir un nouveau mot de passe", link,
                "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé."));
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
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            // Checked on every request against the stored stamp: banning or a
            // password change rotates it, which invalidates the token at once
            // instead of after ExpireMinutes.
            new Claim("sst", user.SecurityStamp ?? string.Empty)
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
                Role = user.Role,
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
            EmailTemplate.Render(
                $"Bienvenue sur PartnR, {user.FirstName} !",
                EmailTemplate.Paragraph("Une dernière étape : confirmez votre adresse email pour activer votre compte et rejoindre votre première sortie."),
                "Confirmer mon email", link,
                "Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email."));
    }
}
