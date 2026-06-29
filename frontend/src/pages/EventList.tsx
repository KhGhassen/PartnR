import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents } from '../api/events';
import { listActivities } from '../api/activities';
import { listCities } from '../api/cities';
import { toApiError } from '../api/client';
import { trackAction } from '../api/analytics';
import type { EventSummary, Activity } from '../types';

export default function EventList() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [activityId, setActivityId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const result = await listEvents({
        city: city || undefined,
        activityId: activityId || undefined,
        page: p,
        pageSize: 20,
      });
      setEvents(result.items);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (err) {
      const apiErr = toApiError(err);
      setError(apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listActivities().then(setActivities).catch(() => {});
    listCities().then(setCities).catch(() => {});
    fetchEvents(1);
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents(1);
    trackAction({ action: 'events_searched', metadata: JSON.stringify({ city, activityId }) });
  };

  const goToPage = (p: number) => {
    fetchEvents(p);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Événements</h1>
        <Link
          to="/events/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Créer un événement
        </Link>
      </div>

      <form onSubmit={handleFilter} className="flex gap-3 mb-8">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Toutes les villes</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Toutes les activités</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon} {a.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
        >
          Filtrer
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => fetchEvents()}
            className="text-red-600 underline hover:text-red-800 ml-4"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">Aucun événement trouvé.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <Link
                key={ev.id}
                to={`/events/${ev.id}`}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{ev.activityIcon}</span>
                  <span className="text-sm text-gray-500">{ev.activityName}</span>
                </div>
                <h2 className="text-lg font-semibold mb-2">{ev.title}</h2>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>📍 {ev.city}{ev.location ? ` — ${ev.location}` : ''}</p>
                  <p>📅 {new Date(ev.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</p>
                  <p>👥 {ev.participantCount}/{ev.maxParticipants} participants</p>
                  <p className="text-xs text-gray-400">Par {ev.creatorName}</p>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
              >
                Précédent
              </button>
              <span className="px-3 py-1 text-gray-600">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
