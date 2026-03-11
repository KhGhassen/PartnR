import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents } from '../api/events';
import { listActivities } from '../api/activities';
import type { EventSummary, Activity } from '../types';

export default function EventList() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [city, setCity] = useState('');
  const [activityId, setActivityId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await listEvents({
        city: city || undefined,
        activityId: activityId || undefined,
      });
      setEvents(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listActivities().then(setActivities).catch(() => {});
    fetchEvents();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
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
        <input
          type="text"
          placeholder="Ville..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
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

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">Aucun événement trouvé.</p>
      ) : (
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
      )}
    </div>
  );
}
