import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEvent, joinEvent, leaveEvent, deleteEvent } from '../api/events';
import { useAuth } from '../context/AuthContext';
import { trackAction } from '../api/analytics';
import type { EventDetail as EventDetailType } from '../types';
import EventChat from '../components/EventChat';
import RatingForm from '../components/RatingForm';
import EventGallery from '../components/EventGallery';
import Button, { ButtonLink } from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import Skeleton from '../components/ui/Skeleton';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [ratingTarget, setRatingTarget] = useState<string | null>(null);
  const [ratedUsers, setRatedUsers] = useState<Set<string>>(new Set());

  const fetchEvent = async () => {
    try {
      const data = await getEvent(id!);
      setEvent(data);
    } catch {
      setError('Événement introuvable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <span className="sr-only">Chargement...</span>
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <Skeleton className="h-56 rounded-none" />
          <div className="space-y-4 p-8">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error || !event) return <p className="py-16 text-center text-red-500">{error}</p>;

  const isCreator = user?.id === event.creatorId;
  const isParticipant = event.participants.some(
    (p) => p.userId === user?.id && p.status === 'Confirmed'
  );
  const isFull = event.participantCount >= event.maxParticipants;
  const confirmed = event.participants.filter((p) => p.status === 'Confirmed');
  const spotsLeft = Math.max(0, event.maxParticipants - event.participantCount);
  const pct = event.maxParticipants > 0 ? Math.min(100, (event.participantCount / event.maxParticipants) * 100) : 0;

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await joinEvent(event.id);
      trackAction({ action: 'event_joined', entityType: 'event', entityId: event.id });
      await fetchEvent();
    } catch (err) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await leaveEvent(event.id);
      trackAction({ action: 'event_left', entityType: 'event', entityId: event.id });
      await fetchEvent();
    } catch (err) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      await deleteEvent(event.id);
      navigate('/');
    } catch (err) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-mid transition-colors hover:text-ink"
      >
        ← Retour aux événements
      </Link>

      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        {/* Cover */}
        {event.photoUrl ? (
          <div className="relative h-64">
            <img src={event.photoUrl} alt={event.title} className="h-full w-full object-cover" />
            <div className="absolute right-4 top-4"><StatusBadge status={event.status} /></div>
          </div>
        ) : (
          <div className="relative flex h-44 items-center bg-gradient-to-br from-coral-50 to-violet-50 px-8">
            <span className="text-7xl">{event.activityIcon}</span>
            <div className="absolute right-4 top-4"><StatusBadge status={event.status} /></div>
          </div>
        )}

        <div className="p-8">
          <div className="mb-5">
            <span className="mb-2 inline-block rounded-full bg-coral-50 px-3 py-1 text-xs font-semibold text-coral-700">
              {event.activityIcon} {event.activityName}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-ink">{event.title}</h1>
          </div>

          {event.description && (
            <p className="mb-6 leading-relaxed text-ink-mid">{event.description}</p>
          )}

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
            <div className="rounded-2xl bg-cream p-4">
              <p className="mb-0.5 text-xs text-ink-sub">Ville</p>
              <p className="font-semibold text-ink">{event.city}</p>
            </div>
            {event.location && (
              <div className="rounded-2xl bg-cream p-4">
                <p className="mb-0.5 text-xs text-ink-sub">Lieu / RDV</p>
                <p className="font-semibold text-ink">{event.location}</p>
              </div>
            )}
            <div className="rounded-2xl bg-cream p-4 col-span-2">
              <p className="mb-0.5 text-xs text-ink-sub">Date</p>
              <p className="font-semibold text-ink">
                {new Date(event.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Capacity */}
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
            <div className="flex -space-x-2">
              {confirmed.slice(0, 5).map((p) => (
                <Avatar key={p.userId} name={p.firstName} url={p.avatarUrl} size="sm" className="ring-2 ring-white" />
              ))}
              {confirmed.length > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-deep text-xs font-semibold text-ink-mid ring-2 ring-white">
                  +{confirmed.length - 5}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-ink">
                  {event.participantCount}/{event.maxParticipants} participants
                </span>
                <span className={isFull ? 'font-semibold text-red-500' : 'text-ink-sub'}>
                  {isFull ? 'Complet' : `${spotsLeft} place${spotsLeft > 1 ? 's' : ''} restante${spotsLeft > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-cream-deep">
                <div className="h-full rounded-full bg-coral-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {/* Actions */}
          {isAuthenticated && (
            <div className="mb-8 flex flex-wrap gap-3">
              {!isParticipant && !isCreator && !isFull && event.status === 'Published' && (
                <Button size="lg" onClick={handleJoin} disabled={actionLoading}>
                  {actionLoading ? 'Un instant…' : 'Rejoindre 🎉'}
                </Button>
              )}
              {isParticipant && !isCreator && (
                <Button variant="ghost" onClick={handleLeave} disabled={actionLoading}>
                  Quitter
                </Button>
              )}
              {isCreator && (
                <>
                  <ButtonLink to={`/events/${event.id}/edit`} variant="ghost">
                    Modifier
                  </ButtonLink>
                  <Button variant="danger" onClick={handleDelete}>
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          )}

          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

          {/* Participants */}
          <h2 className="mb-3 text-lg font-bold text-ink">Participants</h2>
          <div className="mb-8 flex flex-wrap gap-2">
            {confirmed.map((p) => (
              <Link
                key={p.userId}
                to={`/profile/${p.userId}`}
                className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3.5 transition-colors hover:border-coral-300"
              >
                <Avatar name={p.firstName} url={p.avatarUrl} size="sm" />
                <span className="text-sm font-medium text-ink">{p.firstName}</span>
                {p.userId === event.creatorId && (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                    Organisateur
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Ratings section — only for completed events */}
          {event.status === 'Completed' && isParticipant && (
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-bold text-ink">Noter les participants</h2>
              <div className="space-y-3">
                {event.participants
                  .filter((p) => p.status === 'Confirmed' && p.userId !== user?.id)
                  .map((p) => (
                    <div key={p.userId}>
                      {ratingTarget === p.userId ? (
                        <RatingForm
                          eventId={event.id}
                          ratedUserId={p.userId}
                          ratedUserName={p.firstName}
                          onRated={() => {
                            setRatedUsers((prev) => new Set([...prev, p.userId]));
                            setRatingTarget(null);
                          }}
                          onCancel={() => setRatingTarget(null)}
                        />
                      ) : (
                        <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={p.firstName} url={p.avatarUrl} size="sm" />
                            <span className="text-sm font-medium text-ink">{p.firstName}</span>
                          </div>
                          {ratedUsers.has(p.userId) ? (
                            <span className="text-sm font-medium text-emerald-600">Noté ✓</span>
                          ) : (
                            <Button variant="soft" size="sm" onClick={() => setRatingTarget(p.userId)}>
                              Noter
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Photo gallery */}
          <EventGallery
            eventId={event.id}
            photos={event.photos}
            canAdd={isParticipant}
            currentUserId={user?.id}
            isCreator={isCreator}
            onChange={(photos) => setEvent({ ...event, photos })}
          />

          {/* Chat */}
          {isParticipant && event.status !== 'Completed' && <EventChat eventId={event.id} />}
        </div>
      </div>
    </div>
  );
}
