using PartnR.Application.Interfaces.Repositories;
using PartnR.Domain.Entities;
using PartnR.Infrastructure.Data;

namespace PartnR.Infrastructure.Repositories;

public class ReportRepository : Repository<Report>, IReportRepository
{
    public ReportRepository(AppDbContext db) : base(db) { }
}
