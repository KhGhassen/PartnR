namespace PartnR.Application.DTOs.Activities;

public class ActivityDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string Icon { get; set; } = null!;
}
