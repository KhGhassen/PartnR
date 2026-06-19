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
      <h1 className="text-3xl font-bold mb-8">Gestion des événements</h1>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre ou ville..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tous les statuts</option>
          <option value="Published">Publié</option>
          <option value="Cancelled">Annulé</option>
          <option value="Completed">Terminé</option>
        </select>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >
          Rechercher
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading ? (
          <p className="text-center py-8 text-gray-500">Chargement...</p>
        ) : events.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Aucun événement trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
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
                <tr key={ev.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-medium">{ev.title}</td>
                  <td className="py-3 text-gray-500">{ev.city}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="py-3 text-gray-500">{ev.creatorName}</td>
                  <td className="py-3 text-gray-500">{ev.participantCount}/{ev.maxParticipants}</td>
                  <td className="py-3">
                    {ev.status === 'Cancelled' ? (
                      <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                        Annulé
                      </span>
                    ) : ev.status === 'Completed' ? (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                        Terminé
                      </span>
                    ) : (
                      <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                        Publié
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right space-x-3 whitespace-nowrap">
                    {ev.status === 'Published' && (
                      <button
                        onClick={() => handleCancel(ev)}
                        disabled={updatingId === ev.id}
                        className="text-sm font-medium text-orange-600 hover:underline disabled:opacity-50"
                      >
                        {updatingId === ev.id ? '...' : 'Annuler'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(ev)}
                      disabled={updatingId === ev.id}
                      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
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
