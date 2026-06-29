using System.ComponentModel.DataAnnotations;
using PartnR.Domain.Constants;

namespace PartnR.Application.Validation;

public class AllowedCityAttribute : ValidationAttribute
{
    public AllowedCityAttribute() : base("La ville doit faire partie de la liste proposée.")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is not string city) return true;
        return FrenchCities.All.Contains(city);
    }
}
