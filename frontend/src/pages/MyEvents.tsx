import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listEvents } from '../api/events';
import { toApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import Chip from '../components/ui/Chip';
import { ButtonLink } from '../components/ui/Button';
import { EventCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import type { EventSummary } from '../types';

const TABS = [
  { key: 'Published', label: 'À venir' },
  { key: 'Completed', label: 'Passées' },
  { key: 'Cancelled', label: 'Annulées' },
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-text">Mes sorties</h1>
          <p className="mt-1 text-base text-text-2">Celles que vous organisez et celles que vous avez rejointes.</p>
        </div>
        <ButtonLink to="/events/new">
          <Plus size={18} aria-hidden="true" /> Proposer une sortie
        </ButtonLink>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Période">
        {TABS.map((t) => (
          <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-danger-surface px-5 py-4 font-semibold text-danger-strong">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
              ? "Rien de prévu pour l'instant."
              : tab === 'Completed'
                ? 'Aucune sortie passée.'
                : 'Aucune sortie annulée.'
          }
          hint={tab === 'Published' ? 'Rejoignez une sortie près de chez vous, ou proposez la vôtre.' : undefined}
          action={
            tab === 'Published' ? (
              <div className="flex flex-wrap justify-center gap-3">
                <ButtonLink to="/">Découvrir les sorties</ButtonLink>
                <ButtonLink to="/events/new" variant="secondary">Proposer une sortie</ButtonLink>
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-10">
          {organized.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-extrabold text-text">
                J'organise <span className="ml-1 text-base font-bold text-text-3">({organized.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {organized.map((ev) => (
                  <EventCard key={ev.id} ev={ev} showStatus={tab !== 'Published'} />
                ))}
              </div>
            </section>
          )}
          {joined.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-extrabold text-text">
                Je participe <span className="ml-1 text-base font-bold text-text-3">({joined.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {joined.map((ev) => (
                  <EventCard key={ev.id} ev={ev} showStatus={tab !== 'Published'} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
