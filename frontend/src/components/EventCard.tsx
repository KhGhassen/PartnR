import { Link } from 'react-router-dom';
import { Clock, MapPin, Repeat2, Users } from 'lucide-react';
import StatusBadge from './ui/StatusBadge';
import { categoryTone } from '../lib/catalogue';
import type { EventSummary } from '../types';

interface EventCardProps {
  ev: EventSummary;
  showStatus?: boolean;
}

const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' });
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const weekdayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export default function EventCard({ ev, showStatus = false }: EventCardProps) {
  const date = new Date(ev.date);
  const spotsLeft = Math.max(0, ev.maxParticipants - ev.participantCount);
  const isFull = spotsLeft === 0;
  const isScarce = !isFull && spotsLeft <= 2;
  const tone = categoryTone(ev.activityCategory);

  // Seats are the decision, so they get a coloured pill, not a grey line.
  const seatClass = isFull
    ? 'bg-danger-surface text-danger-strong'
    : isScarce
      ? 'bg-warn-surface text-warn-strong'
      : 'bg-success-surface text-success-strong';
  const seatLabel = isFull ? 'Complet' : `${spotsLeft} place${spotsLeft > 1 ? 's' : ''}`;

  return (
    <Link
      to={`/events/${ev.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-border transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
    >
      {/* Photo, or the category pastel with the activity emoji large enough to
          be recognised from across the room. */}
      <div className={`relative h-36 ${tone.bg}`}>
        {ev.photoUrl ? (
          <img src={ev.photoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-6xl" aria-hidden="true">
            {ev.activityIcon}
          </span>
        )}

        {/* The date is what people scan first; a calendar leaf reads at a glance. */}
        <div className="absolute left-4 top-4 flex min-w-14 flex-col items-center rounded-2xl bg-surface px-3 py-1.5 shadow-card">
          <span className="text-2xl font-extrabold leading-none tabular-nums text-text">{dayFmt.format(date)}</span>
          <span className="text-sm font-bold uppercase text-text-3">{monthFmt.format(date).replace('.', '')}</span>
        </div>

        <span className={`absolute right-4 top-4 rounded-full bg-surface/95 px-3 py-1 text-sm font-bold ${tone.text}`}>
          {ev.activityName}
        </span>

        {showStatus && (
          <span className="absolute bottom-3 right-4">
            <StatusBadge status={ev.status} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="line-clamp-2 text-xl font-extrabold leading-snug text-text">{ev.title}</h2>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-text-2">
          <Clock size={16} className="shrink-0 text-text-3" aria-hidden="true" />
          <span>
            <span className="capitalize">{weekdayFmt.format(date)}</span> à {timeFmt.format(date).replace(':', 'h')}
          </span>
          {ev.isRecurring && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-surface px-2 py-0.5 text-sm font-bold text-violet-strong">
              <Repeat2 size={12} aria-hidden="true" />
              {ev.upcomingOccurrences ? `${ev.upcomingOccurrences} dates` : 'Chaque semaine'}
            </span>
          )}
        </p>

        <p className="flex items-center gap-2 text-[15px] text-text-2">
          <MapPin size={16} className="shrink-0 text-text-3" aria-hidden="true" />
          <span className="truncate">
            {ev.city}
            {ev.location ? ` · ${ev.location}` : ''}
            {ev.distanceKm != null ? ` · ${ev.distanceKm.toFixed(1)} km` : ''}
          </span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-text-3">
            <Users size={16} className="shrink-0" aria-hidden="true" />
            <span className="truncate">
              {ev.participantCount}/{ev.maxParticipants} · par {ev.creatorName}
            </span>
          </span>
          <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${seatClass}`}>{seatLabel}</span>
        </div>
      </div>
    </Link>
  );
}
