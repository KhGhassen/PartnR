import { useEffect, useState } from 'react';
import { listEvents } from '../api/events';
import { toApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { bandColor } from '../components/ui/classes';
import Chip from '../components/ui/Chip';
import { ButtonLink } from '../components/ui/Button';
import { EventCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import type { EventSummary } from '../types';

const TABS = [
  { key: 'Published', label: 'À venir' },
  { key: 'Completed', label: 'Terminés' },
  { key: 'Cancelled', label: 'Annulés' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function MyEvents() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>('Published');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await listEvents({ mine: true, status: tab, pageSize: 50 });
        if (!cancelled) setEvents(result.items);
      } catch (err) {
        if (!cancelled) setError(toApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const organized = events.filter((e) => e.creatorId === user?.id);
  const joined = events.filter((e) => e.creatorId !== user?.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-3xl font-bold tracking-tight text-ink">Mes événements</h1>
      <p className="mb-6 text-ink-sub">Les activités que vous organisez ou avez rejointes.</p>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <span className="sr-only">Chargement...</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          emoji={tab === 'Published' ? '🗓️' : tab === 'Completed' ? '🏁' : '🚫'}
          title={
            tab === 'Published'
              ? 'Aucun événement à venir.'
              : tab === 'Completed'
                ? 'Aucun événement terminé.'
                : 'Aucun événement annulé.'
          }
          hint={tab === 'Published' ? 'Rejoignez une activité ou créez la vôtre !' : undefined}
          action={
            tab === 'Published' ? (
              <div className="flex gap-3">
                <ButtonLink to="/">Parcourir les événements</ButtonLink>
                <ButtonLink to="/events/new" variant="soft">Créer un événement</ButtonLink>
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-10">
          {organized.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold text-ink">
                Organisés par moi <span className="ml-1 text-sm font-normal text-ink-sub">({organized.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {organized.map((ev, i) => (
                  <EventCard key={ev.id} ev={ev} bandColor={bandColor(i)} showStatus={tab !== 'Published'} />
                ))}
              </div>
            </section>
          )}
          {joined.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold text-ink">
                Rejoints <span className="ml-1 text-sm font-normal text-ink-sub">({joined.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {joined.map((ev, i) => (
                  <EventCard key={ev.id} ev={ev} bandColor={bandColor(i + 1)} showStatus={tab !== 'Published'} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
