using System.ComponentModel.DataAnnotations;

namespace PartnR.Application.Validation;

// Cities now come from the geo.api.gouv.fr autocomplete (any French commune),
// so this only sanity-checks the value instead of enforcing a fixed list.
public class AllowedCityAttribute : ValidationAttribute
{
    public AllowedCityAttribute() : base("Ville invalide.")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is not string city) return true;
        var trimmed = city.Trim();
        return trimmed.Length is >= 1 and <= 100;
    }
}
