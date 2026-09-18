import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Repeat2, Users } from 'lucide-react';
import StatusBadge from './ui/StatusBadge';
import type { EventSummary } from '../types';

interface EventCardProps {
  ev: EventSummary;
  showStatus?: boolean;
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export default function EventCard({ ev, showStatus = false }: EventCardProps) {
  const date = new Date(ev.date);
  const pct = ev.maxParticipants > 0 ? Math.min(100, (ev.participantCount / ev.maxParticipants) * 100) : 0;
  const spotsLeft = Math.max(0, ev.maxParticipants - ev.participantCount);
  const isFull = spotsLeft === 0;
  const isScarce = !isFull && spotsLeft <= 2;

  // Scarcity is the product's core pressure, so it gets its own colour rather
  // than being one more grey line.
  const gaugeTone = isFull ? 'bg-danger' : isScarce ? 'bg-warn' : 'bg-accent';
  const seatTone = isFull ? 'text-danger' : isScarce ? 'text-warn' : 'text-text-2';

  return (
    <Link
      to={`/events/${ev.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative h-28 bg-surface-sunken">
        {ev.photoUrl && (
          <img src={ev.photoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        {/* The activity emoji is content — an admin-editable taxonomy — so it
            stays, promoted into a medallion instead of floating in a pastel
            field whose colour came from the row index. */}
        <span className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-border bg-surface text-2xl shadow-card">
          {ev.activityIcon}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium text-text-2 backdrop-blur-sm">
          {ev.activityName}
        </span>
        {showStatus && (
          <span className="absolute bottom-3 right-3">
            <StatusBadge status={ev.status} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Reading order follows the decision: when, then what, then where. */}
        <p className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium tabular-nums text-text-2">
          <CalendarDays size={14} className="shrink-0" aria-hidden="true" />
          <span>
            {dateFmt.format(date)} · {timeFmt.format(date)}
          </span>
          {ev.isRecurring && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-surface px-2 py-0.5 text-[11px] font-semibold text-violet">
              <Repeat2 size={12} aria-hidden="true" />
              {ev.upcomingOccurrences ? `${ev.upcomingOccurrences} dates` : 'Chaque semaine'}
            </span>
          )}
        </p>

        <h2 className="mb-2 line-clamp-2 font-display text-xl leading-tight font-bold text-text">
          {ev.title}
        </h2>

        <p className="mb-4 flex items-center gap-1.5 truncate text-[13px] text-text-3">
          <MapPin size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate">
            {ev.city}
            {ev.location ? ` — ${ev.location}` : ''}
            {ev.distanceKm != null ? ` · ${ev.distanceKm.toFixed(1)} km` : ''}
          </span>
        </p>

        <div className="mt-auto">
          <div className="mb-2.5 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
              <div className={`h-full rounded-full ${gaugeTone}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-semibold tabular-nums ${seatTone}`}>
              {isFull ? 'Complet' : `${spotsLeft} place${spotsLeft > 1 ? 's' : ''}`}
            </span>
          </div>

          {/* "Voir →" is gone: the whole card is the link, so the affordance was
              redundant chrome competing with the title. */}
          <p className="flex items-center gap-1.5 text-xs text-text-3">
            <Users size={13} className="shrink-0" aria-hidden="true" />
            <span className="truncate">
              {`par ${ev.creatorName} · ${ev.participantCount}/${ev.maxParticipants}`}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
