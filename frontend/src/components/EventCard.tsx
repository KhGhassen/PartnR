import { Link } from 'react-router-dom';
import StatusBadge from './ui/StatusBadge';
import type { EventSummary } from '../types';

interface EventCardProps {
  ev: EventSummary;
  bandColor: string;
  showStatus?: boolean;
}

export default function EventCard({ ev, bandColor, showStatus = false }: EventCardProps) {
  const pct = ev.maxParticipants > 0 ? Math.min(100, (ev.participantCount / ev.maxParticipants) * 100) : 0;
  const spotsLeft = Math.max(0, ev.maxParticipants - ev.participantCount);
  const isFull = spotsLeft === 0;

  return (
    <Link
      to={`/events/${ev.id}`}
      className="group overflow-hidden rounded-3xl border border-line bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
    >
      {ev.photoUrl ? (
        <div className="relative h-32">
          <img src={ev.photoUrl} alt="" className="h-full w-full object-cover" />
          <span className="absolute right-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-ink backdrop-blur-sm">
            {ev.activityIcon} {ev.activityName}
          </span>
          {showStatus && <span className="absolute left-3 top-3"><StatusBadge status={ev.status} /></span>}
        </div>
      ) : (
        <div className={`relative flex h-32 items-center px-6 ${bandColor}`}>
          <span className="text-4xl transition-transform duration-200 group-hover:scale-110">{ev.activityIcon}</span>
          <span className="absolute right-3 top-3 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-ink">
            {ev.activityName}
          </span>
          {showStatus && <span className="absolute left-3 bottom-3"><StatusBadge status={ev.status} /></span>}
        </div>
      )}

      <div className="p-5">
        <h2 className="mb-1 truncate font-semibold text-ink">{ev.title}</h2>
        <p className="mb-1 text-sm text-ink-sub">
          📅 {new Date(ev.date).toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <p className="mb-4 truncate text-sm text-ink-sub">
          📍 {ev.city}
          {ev.location ? ` — ${ev.location}` : ''}
          {ev.distanceKm != null ? ` · ${ev.distanceKm.toFixed(1)} km` : ''}
        </p>

        <div className="mb-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-deep">
            <div className="h-full rounded-full bg-coral-500" style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-xs font-medium ${isFull ? 'text-red-500' : 'text-ink-mid'}`}>
            {isFull ? 'Complet' : `${spotsLeft} place${spotsLeft > 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-sub">par {ev.creatorName}</span>
          <span className="text-xs font-semibold text-coral-500 transition-transform duration-200 group-hover:translate-x-0.5">
            Voir →
          </span>
        </div>
      </div>
    </Link>
  );
}
