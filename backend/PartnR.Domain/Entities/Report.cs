namespace PartnR.Domain.Entities;

public class Report
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReporterId { get; set; }
    public string TargetType { get; set; } = string.Empty; // "user" | "event"
    public Guid TargetId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // "Pending" | "Resolved"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
