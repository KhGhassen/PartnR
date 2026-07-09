import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listReports, resolveReport, type Report } from '../api/reports';
import { toApiError } from '../api/client';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function AdminReports() {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await listReports();
        if (!cancelled) setReports(data);
      } catch (err) {
        if (!cancelled) setError(toApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await resolveReport(id);
      setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'Resolved' } : r)));
      toast.success('Signalement marqué comme traité.');
    } catch {
      toast.error('Action impossible.');
    }
  };

  if (loading) return <p className="py-16 text-center text-ink-sub">Chargement...</p>;
  if (error) return <p className="py-16 text-center text-red-500">{error}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-3xl font-bold tracking-tight text-ink">Signalements</h1>
      <p className="mb-6 text-ink-sub">
        {reports.filter((r) => r.status === 'Pending').length} en attente de traitement.
      </p>

      {reports.length === 0 ? (
        <EmptyState emoji="🚩" title="Aucun signalement." hint="Tout va bien pour le moment." />
      ) : (
        <div className="bg-white rounded-3xl border border-line p-6 shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-sub border-b border-line text-xs uppercase tracking-wide">
                <th className="pb-2 font-medium">Cible</th>
                <th className="pb-2 font-medium">Raison</th>
                <th className="pb-2 font-medium">Par</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-cream-deep last:border-0">
                  <td className="py-3">
                    {r.targetType === 'event' ? (
                      <Link to={`/events/${r.targetId}`} className="font-medium text-coral-600 hover:underline">
                        📅 {r.targetLabel}
                      </Link>
                    ) : (
                      <Link to={`/profile/${r.targetId}`} className="font-medium text-coral-600 hover:underline">
                        👤 {r.targetLabel}
                      </Link>
                    )}
                  </td>
                  <td className="py-3 max-w-xs text-ink-mid">{r.reason}</td>
                  <td className="py-3 text-ink-mid">{r.reporterName}</td>
                  <td className="py-3 text-ink-sub">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 text-right">
                    {r.status === 'Pending' ? (
                      <Button size="sm" variant="soft" onClick={() => handleResolve(r.id)}>
                        Marquer traité
                      </Button>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                        Traité
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
