using System.ComponentModel.DataAnnotations;

namespace PartnR.Application.Interfaces.Services;

public class CreateReportDto
{
    [Required, RegularExpression("^(user|event)$")]
    public string TargetType { get; set; } = null!;

    [Required]
    public Guid TargetId { get; set; }

    [Required, MinLength(10), MaxLength(500)]
    public string Reason { get; set; } = null!;
}

public record ReportDto(
    Guid Id,
    Guid ReporterId,
    string ReporterName,
    string TargetType,
    Guid TargetId,
    string TargetLabel,
    string Reason,
    string Status,
    DateTime CreatedAt);

public interface IReportService
{
    Task<Guid> CreateAsync(Guid reporterId, CreateReportDto dto);
    Task<List<ReportDto>> ListAsync(Guid requestingUserId);
    Task ResolveAsync(Guid requestingUserId, Guid reportId);
}
