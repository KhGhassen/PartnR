import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEvents, cancelEvent, deleteEvent } from '../api/admin';
import { toApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { AdminEvent } from '../types';

export default function AdminEventsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const load = (term: string, statusFilter: string) => {
    setLoading(true);
    setError('');
    listEvents({ search: term || undefined, status: statusFilter || undefined, pageSize: 50 })
      .then((res) => setEvents(res.items))
      .catch((err) => setError(toApiError(err).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') load('', '');
  }, [isAuthenticated, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    load(search, status);
  };

  const handleCancel = async (ev: AdminEvent) => {
    setUpdatingId(ev.id);
    setError('');
    try {
      const updated = await cancelEvent(ev.id);
      setEvents((list) => list.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (ev: AdminEvent) => {
    if (!confirm(`Supprimer définitivement "${ev.title}" ?`)) return;
    setUpdatingId(ev.id);
    setError('');
    try {
      await deleteEvent(ev.id);
      setEvents((list) => list.filter((e) => e.id !== ev.id));
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-text mb-8">Gestion des sorties</h1>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre ou ville..."
          className="flex-1 rounded-2xl border-2 border-border-input px-4 py-3 text-base outline-none focus:border-primary"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-2xl border-2 border-border-input px-4 py-3 text-base outline-none focus:border-primary"
        >
          <option value="">Tous les statuts</option>
          <option value="Published">Ouvert</option>
          <option value="Cancelled">Annulé</option>
          <option value="Completed">Terminé</option>
        </select>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-bold text-on-primary hover:bg-primary-hover"
        >
          Rechercher
        </button>
      </form>

      {error && <p className="text-danger-strong text-sm mb-4">{error}</p>}

      <div className="bg-surface rounded-3xl ring-1 ring-border p-6 shadow-card">
        {loading ? (
          <p className="text-center py-8 text-text-3">Chargement...</p>
        ) : events.length === 0 ? (
          <p className="text-center py-8 text-text-3">Aucune sortie trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-3 border-b border-border text-sm uppercase tracking-wide">
                <th className="pb-2 font-medium">Titre</th>
                <th className="pb-2 font-medium">Ville</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Organisateur</th>
                <th className="pb-2 font-medium">Participants</th>
                <th className="pb-2 font-medium">Statut</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-border last:border-0 hover:bg-surface-sunken transition-colors">
                  <td className="py-3 font-medium">{ev.title}</td>
                  <td className="py-3 text-text-2">{ev.city}</td>
                  <td className="py-3 text-text-2">
                    {new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="py-3 text-text-2">{ev.creatorName}</td>
                  <td className="py-3 text-text-2">{ev.participantCount}/{ev.maxParticipants}</td>
                  <td className="py-3">
                    {ev.status === 'Cancelled' ? (
                      <span className="bg-danger-surface text-danger-strong px-2 py-1 rounded-full text-sm font-medium">
                        Annulé
                      </span>
                    ) : ev.status === 'Completed' ? (
                      <span className="bg-surface-sunken text-text-2 px-2 py-1 rounded-full text-sm font-medium">
                        Terminé
                      </span>
                    ) : (
                      <span className="bg-success-surface text-success-strong px-2 py-1 rounded-full text-sm font-medium">
                        Ouvert
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right space-x-3 whitespace-nowrap">
                    {ev.status === 'Published' && (
                      <button
                        onClick={() => handleCancel(ev)}
                        disabled={updatingId === ev.id}
                        className="text-sm font-medium text-warn-strong hover:underline disabled:opacity-50"
                      >
                        {updatingId === ev.id ? '...' : 'Annuler'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(ev)}
                      disabled={updatingId === ev.id}
                      className="text-sm font-medium text-danger-strong hover:underline disabled:opacity-50"
                    >
                      {updatingId === ev.id ? '...' : 'Supprimer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
