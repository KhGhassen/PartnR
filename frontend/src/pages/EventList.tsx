import { useEffect, useRef, useState } from 'react';
import { MapPin, Plus, Search } from 'lucide-react';
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
import { categoryTone, groupByCategory } from '../lib/catalogue';
import EventCard from '../components/EventCard';
import type { EventSummary, Activity } from '../types';

export default function EventList() {
  const isAuthenticated = useAuth()?.isAuthenticated ?? false;
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [activityId, setActivityId] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchEvents = async (p: number, c = city, a = activityId, s = search, cat = category) => {
    setLoading(true);
    setError('');
    try {
      const result = await listEvents({
        city: c || undefined,
        activityId: a || undefined,
        category: !a && cat ? cat : undefined,
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

  const applyFilters = (c: string, a: string, cat = category) => {
    // A search typed within the last 400 ms would otherwise fire with the
    // filters captured before this click and overwrite the result.
    clearTimeout(searchDebounce.current);
    setCity(c);
    setActivityId(a);
    setCategory(cat);
    fetchEvents(1, c, a, search, cat);
    trackAction({ action: 'events_searched', metadata: JSON.stringify({ city: c, activityId: a, category: cat }) });
  };

  const applySearch = (s: string) => {
    setSearch(s);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchEvents(1, city, activityId, s), 400);
  };

  useEffect(() => () => clearTimeout(searchDebounce.current), []);

  const groups = groupByCategory(activities);
  const selectedGroup = groups.find((g) => g.category === category) ?? null;
  const allSelected = category === '' && activityId === '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {/* Hero: bright, one promise, one sunny button. */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-primary px-6 py-10 text-on-primary sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-sun/30"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 right-24 h-64 w-64 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-base font-bold text-white/90">
            {totalCount > 0
              ? `${totalCount} sortie${totalCount > 1 ? 's' : ''} à venir près de chez vous`
              : 'Des sorties près de chez vous'}
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl">
            Sortez, rencontrez, partagez.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/90">
            Un footing, un resto, une expo, une partie de cartes… Trouvez des gens près de chez vous
            pour ne plus rien faire seul.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <ButtonLink to="/events/new" variant="sun" size="lg">
                <Plus size={20} aria-hidden="true" /> Proposer une sortie
              </ButtonLink>
            ) : (
              <ButtonLink to="/register" variant="sun" size="lg">
                Je crée mon compte, c'est gratuit
              </ButtonLink>
            )}
            <ButtonLink
              to="/map"
              variant="ghost"
              size="lg"
              className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20"
            >
              <MapPin size={20} aria-hidden="true" /> Voir la carte
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Search: two big fields side by side, labelled. */}
      <div className="mb-6 grid gap-3 rounded-3xl bg-surface p-4 shadow-card sm:grid-cols-[1fr_auto] sm:p-5">
        <label className="block">
          <span className="mb-2 block text-[15px] font-bold text-text">Que cherchez-vous ?</span>
          <span className="relative block">
            <Search
              size={20}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-3"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Un footing, un resto, un lieu…"
              className={inputClass(false, 'pl-12')}
            />
          </span>
        </label>
        <label className="block sm:min-w-56">
          <span className="mb-2 block text-[15px] font-bold text-text">Où ?</span>
          <span className="relative block">
            <MapPin
              size={20}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-3"
            />
            <select
              value={city}
              onChange={(e) => applyFilters(e.target.value, activityId)}
              className={inputClass(false, 'appearance-none pl-12 pr-10')}
            >
              <option value="">Toutes les villes</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-3" aria-hidden="true">▾</span>
          </span>
        </label>
      </div>

      {/* Categories as big tiles: pick an urge, not a filter. */}
      <section className="mb-8" aria-labelledby="cat-title">
        <h2 id="cat-title" className="mb-3 text-xl font-extrabold text-text">Qu'est-ce qui vous tente ?</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
          <button
            type="button"
            aria-pressed={allSelected}
            onClick={() => applyFilters(city, '', '')}
            className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 text-sm font-bold transition-all ${
              allSelected
                ? 'border-primary bg-primary text-on-primary shadow-card'
                : 'border-border bg-surface text-text-2 hover:border-primary hover:text-primary-strong'
            }`}
          >
            <span className="text-2xl" aria-hidden="true">✨</span>
            Tout
          </button>
          {groups.map((g) => {
            const active = category === g.category;
            const tone = categoryTone(g.category);
            return (
              <button
                key={g.category}
                type="button"
                aria-pressed={active}
                onClick={() => applyFilters(city, '', active ? '' : g.category)}
                className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 text-center text-sm font-bold leading-tight transition-all ${
                  active
                    ? `border-primary ${tone.bg} ${tone.text} shadow-card`
                    : `border-transparent ${tone.bg} ${tone.text} hover:border-primary/50`
                }`}
              >
                <span className="text-2xl" aria-hidden="true">{g.icon}</span>
                {g.category}
              </button>
            );
          })}
        </div>
        {selectedGroup && (
          <div
            role="group"
            className="mt-3 flex flex-wrap gap-2"
            aria-label={`Activités — ${selectedGroup.category}`}
          >
            {selectedGroup.activities.map((a) => (
              <Chip
                key={a.id}
                active={activityId === a.id}
                onClick={() => applyFilters(city, activityId === a.id ? '' : a.id, selectedGroup.category)}
              >
                <span aria-hidden="true">{a.icon}</span> {a.name}
              </Chip>
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-danger-surface bg-danger-surface px-5 py-4">
          <p className="font-semibold text-danger-strong">{error}</p>
          <Button variant="danger" size="sm" onClick={() => fetchEvents(page)}>
            Réessayer
          </Button>
        </div>
      )}

      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-extrabold text-text">
          {selectedGroup ? selectedGroup.category : 'Toutes les sorties'}
          {!loading && totalCount > 0 && (
            <span className="ml-2 text-base font-bold text-text-3">({totalCount})</span>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <span className="sr-only">Chargement...</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="Aucune sortie pour l'instant."
          hint="Essayez une autre catégorie ou une autre ville, ou proposez la vôtre : quelqu'un attend sûrement la même chose."
          action={
            <ButtonLink to={isAuthenticated ? '/events/new' : '/register'} variant="sun">
              <Plus size={18} aria-hidden="true" /> Proposer une sortie
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button variant="ghost" onClick={() => fetchEvents(page - 1)} disabled={page <= 1}>
                ← Page précédente
              </Button>
              <span className="text-[15px] font-bold text-text-2">
                {page} / {totalPages}
              </span>
              <Button variant="ghost" onClick={() => fetchEvents(page + 1)} disabled={page >= totalPages}>
                Page suivante →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
