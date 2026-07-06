import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listEvents } from '../api/events';
import { listActivities } from '../api/activities';
import { listCities } from '../api/cities';
import { toApiError } from '../api/client';
import { trackAction } from '../api/analytics';
import Chip from '../components/ui/Chip';
import Button, { ButtonLink } from '../components/ui/Button';
import { EventCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { inputClass } from '../components/ui/classes';
import EventCard from '../components/EventCard';
import { bandColor } from '../components/ui/classes';
import type { EventSummary, Activity } from '../types';

export default function EventList() {
  const isAuthenticated = useAuth()?.isAuthenticated ?? false;
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [activityId, setActivityId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchEvents = async (p: number, c = city, a = activityId, s = search) => {
    setLoading(true);
    setError('');
    try {
      const result = await listEvents({
        city: c || undefined,
        activityId: a || undefined,
        search: s.trim() || undefined,
        page: p,
        pageSize: 20,
      });
      setEvents(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setPage(result.page);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listActivities().then(setActivities).catch(() => {});
    listCities().then(setCities).catch(() => {});
    fetchEvents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (c: string, a: string) => {
    setCity(c);
    setActivityId(a);
    fetchEvents(1, c, a);
    trackAction({ action: 'events_searched', metadata: JSON.stringify({ city: c, activityId: a }) });
  };

  const applySearch = (s: string) => {
    setSearch(s);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchEvents(1, city, activityId, s), 400);
  };

  useEffect(() => () => clearTimeout(searchDebounce.current), []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-coral-500 to-violet-500 px-8 py-10 text-white">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-40 w-40 rounded-full bg-white/10" />
        <p className="mb-1 text-sm font-medium text-white/80">
          {totalCount > 0 ? `${totalCount} événement${totalCount > 1 ? 's' : ''} à venir` : 'PartnR'}
        </p>
        <h1 className="max-w-lg text-3xl font-bold leading-tight tracking-tight">
          {isAuthenticated
            ? "Trouvez votre prochain partenaire d'activité"
            : 'Ne faites plus rien seul·e.'}
        </h1>
        {!isAuthenticated && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
            Course à pied, resto, concert, expo… PartnR vous connecte avec des gens près de
            chez vous qui partagent vos envies. Rejoignez une activité en deux clics, ou
            proposez la vôtre.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          {isAuthenticated ? (
            <Link
              to="/events/new"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-coral-600 transition-colors hover:bg-coral-50"
            >
              + Créer un événement
            </Link>
          ) : (
            <Link
              to="/register"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-coral-600 transition-colors hover:bg-coral-50"
            >
              Rejoindre PartnR — c'est gratuit
            </Link>
          )}
          <Link
            to="/map"
            className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            📍 Voir la carte
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-sub">🔍</span>
        <input
          type="search"
          value={search}
          onChange={(e) => applySearch(e.target.value)}
          placeholder="Rechercher un événement, un lieu…"
          className={inputClass(false, 'pl-11')}
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap gap-2">
          <Chip active={activityId === ''} onClick={() => applyFilters(city, '')}>
            Tout
          </Chip>
          {activities.map((a) => (
            <Chip
              key={a.id}
              active={activityId === a.id}
              onClick={() => applyFilters(city, activityId === a.id ? '' : a.id)}
            >
              {a.icon} {a.name}
            </Chip>
          ))}
        </div>
        <select
          value={city}
          onChange={(e) => applyFilters(e.target.value, activityId)}
          className={inputClass(false, 'w-auto min-w-44')}
        >
          <option value="">Toutes les villes</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="danger" size="sm" onClick={() => fetchEvents(page)}>
            Réessayer
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <span className="sr-only">Chargement...</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="Aucun événement trouvé."
          hint="Essayez d'élargir vos filtres, ou lancez votre propre activité !"
          action={<ButtonLink to="/events/new">Créer un événement</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev, i) => (
              <EventCard key={ev.id} ev={ev} bandColor={bandColor(i)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => fetchEvents(page - 1)} disabled={page <= 1}>
                ← Précédent
              </Button>
              <span className="text-sm text-ink-mid">
                Page {page} / {totalPages}
              </span>
              <Button variant="ghost" size="sm" onClick={() => fetchEvents(page + 1)} disabled={page >= totalPages}>
                Suivant →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
