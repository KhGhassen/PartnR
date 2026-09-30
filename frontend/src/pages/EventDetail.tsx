import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { ArrowLeft, CalendarPlus, Clock, MapPin, Pencil, Share2, Trash2, Users } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '../lib/leafletIcons';
import { getEvent, joinEvent, leaveEvent, deleteEvent } from '../api/events';
import { toApiError } from '../api/client';
import { loginUrl } from '../lib/redirect';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { trackAction } from '../api/analytics';
import { downloadIcs, shareEvent } from '../lib/calendar';
import { categoryTone } from '../lib/catalogue';
import type { EventDetail as EventDetailType } from '../types';
import EventChat from '../components/EventChat';
import RatingForm from '../components/RatingForm';
import EventGallery from '../components/EventGallery';
import EventComments from '../components/EventComments';
import ReportButton from '../components/ReportButton';
import Button, { ButtonLink } from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import Skeleton from '../components/ui/Skeleton';

const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' });
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const longDateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

// One fact per tile: an icon, a one-word label, the value in bold. Reads at
// arm's length, on a phone, by someone who skims.
function Fact({ icon, label, value, sub }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-surface-sunken p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface text-primary shadow-card" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-sm font-bold text-text-3">{label}</dt>
        <dd className="text-base font-extrabold text-text">{value}</dd>
        {sub && <dd className="text-[15px] text-text-2">{sub}</dd>}
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
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
      setError('Sortie introuvable.');
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
        <div className="overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-border">
          <Skeleton className="h-52 rounded-none" />
          <div className="space-y-4 p-8">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error || !event) return <p className="py-16 text-center text-lg font-semibold text-danger-strong">{error}</p>;

  const isCreator = user?.id === event.creatorId;
  const isParticipant = event.participants.some((p) => p.userId === user?.id && p.status === 'Confirmed');
  const isFull = event.participantCount >= event.maxParticipants;
  const isWaitlisted = event.participants.some((p) => p.userId === user?.id && p.status === 'Waitlisted');
  const waitlistCount = event.participants.filter((p) => p.status === 'Waitlisted').length;
  const confirmed = event.participants.filter((p) => p.status === 'Confirmed');
  // Defensive: an API response predating the recurrence feature (deploy skew,
  // cached response) must not take the whole page down.
  const occurrences = event.occurrences ?? [];
  const spotsLeft = Math.max(0, event.maxParticipants - event.participantCount);
  const date = new Date(event.date);
  const tone = categoryTone(event.activityCategory);
  const isOpen = event.status === 'Published';
  const seatsSentence = `${spotsLeft} place${spotsLeft > 1 ? 's' : ''} restante${spotsLeft > 1 ? 's' : ''}`;

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await joinEvent(event.id);
      trackAction({ action: 'event_joined', entityType: 'event', entityId: event.id });
      if (isFull) {
        toast.info("Vous êtes en liste d'attente — on vous prévient dès qu'une place se libère.");
      } else {
        toast.success('Vous participez à cette sortie 🎉');
      }
      await fetchEvent();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await leaveEvent(event.id);
      trackAction({ action: 'event_left', entityType: 'event', entityId: event.id });
      toast.info('Vous ne participez plus à cette sortie.');
      await fetchEvent();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette sortie ?')) return;
    const applyToSeries =
      (event.occurrences?.length ?? 0) > 1 &&
      confirm(`Supprimer aussi les ${event.occurrences.length - 1} autres dates de la série ?`);
    try {
      await deleteEvent(event.id, applyToSeries);
      toast.info(applyToSeries ? 'Série supprimée.' : 'Sortie supprimée.');
      navigate('/');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const handleShare = async () => {
    try {
      const result = await shareEvent(event);
      if (result === 'copied') toast.success('Lien copié !');
    } catch {
      // user cancelled the share sheet
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <Link
        to="/"
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-bold text-text-2 transition-colors hover:bg-surface-sunken hover:text-text"
      >
        <ArrowLeft size={18} aria-hidden="true" /> Toutes les sorties
      </Link>

      <article className="overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-border">
        {/* Cover: the photo, or the category pastel with the activity large. */}
        <div className={`relative ${event.photoUrl ? 'h-64 sm:h-80' : 'h-44 sm:h-52'} ${tone.bg}`}>
          {event.photoUrl ? (
            <img src={event.photoUrl} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-8xl" aria-hidden="true">
              {event.activityIcon}
            </span>
          )}
          <div className="absolute left-5 top-5 flex min-w-16 flex-col items-center rounded-2xl bg-surface px-4 py-2 shadow-card">
            <span className="text-3xl font-extrabold leading-none tabular-nums text-text">{dayFmt.format(date)}</span>
            <span className="text-sm font-bold uppercase text-text-3">{monthFmt.format(date).replace('.', '')}</span>
          </div>
          <div className="absolute right-5 top-5">
            <StatusBadge status={event.status} />
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${tone.bg} ${tone.text}`}>
            <span aria-hidden="true">{event.activityIcon}</span> {event.activityName}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-text sm:text-4xl">{event.title}</h1>
          <p className="mt-2 text-base text-text-2">
            Proposé par{' '}
            <Link to={`/profile/${event.creatorId}`} className="font-bold text-primary-strong hover:underline">
              {event.creatorName}
            </Link>
          </p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <Fact
              icon={<Clock size={22} />}
              label="Quand"
              value={<span className="capitalize">{longDateFmt.format(date)}</span>}
              sub={`à ${timeFmt.format(date).replace(':', 'h')}`}
            />
            <Fact
              icon={<MapPin size={22} />}
              label="Où"
              value={event.city}
              sub={
                event.location ? (
                  <span>{event.location}</span>
                ) : event.locationHidden ? (
                  <span>🔒 L'adresse exacte est communiquée aux participants.</span>
                ) : undefined
              }
            />
            <Fact
              icon={<Users size={22} />}
              label="Qui"
              value={`${event.participantCount} / ${event.maxParticipants} participants`}
              sub={
                isFull ? (
                  <span className="font-bold text-danger-strong">Complet</span>
                ) : (
                  <span>
                    {seatsSentence}
                    {waitlistCount > 0 ? ` · ${waitlistCount} en attente` : ''}
                  </span>
                )
              }
            />
          </dl>

          {/* One block, one decision. */}
          {isOpen && (
            <div className="mt-6 rounded-2xl bg-primary-surface p-5">
              {!isAuthenticated && (
                <>
                  <p className="mb-4 text-base font-semibold text-text">
                    {isFull
                      ? "Cette sortie est complète — inscrivez-vous pour rejoindre la liste d'attente."
                      : `${seatsSentence} — rejoignez PartnR pour participer.`}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <ButtonLink to={loginUrl(`/events/${event.id}`)} variant="sun" size="lg">
                      Se connecter pour rejoindre
                    </ButtonLink>
                    <ButtonLink to={`/register?redirect=${encodeURIComponent(`/events/${event.id}`)}`} variant="ghost" size="lg">
                      Créer un compte
                    </ButtonLink>
                  </div>
                </>
              )}
              {isAuthenticated && !isParticipant && !isWaitlisted && !isCreator && (
                <div className="flex flex-wrap items-center gap-3">
                  {isFull ? (
                    <Button size="lg" variant="violet" onClick={handleJoin} disabled={actionLoading}>
                      {actionLoading ? 'Un instant…' : "Rejoindre la liste d'attente"}
                    </Button>
                  ) : (
                    <Button size="lg" variant="sun" onClick={handleJoin} disabled={actionLoading}>
                      {actionLoading ? 'Un instant…' : 'Je participe'}
                    </Button>
                  )}
                  <p className="text-[15px] text-text-2">
                    {isFull ? "Vous serez prévenu dès qu'une place se libère." : "Gratuit, et vous pouvez changer d'avis."}
                  </p>
                </div>
              )}
              {isAuthenticated && isWaitlisted && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex min-h-11 items-center rounded-full bg-violet-surface px-4 text-[15px] font-bold text-violet-strong">
                    ⏳ Vous êtes en liste d'attente
                  </span>
                  <Button variant="ghost" onClick={handleLeave} disabled={actionLoading}>
                    Quitter la liste d'attente
                  </Button>
                </div>
              )}
              {isAuthenticated && isParticipant && !isCreator && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex min-h-11 items-center rounded-full bg-success-surface px-4 text-[15px] font-bold text-success-strong">
                    ✓ Vous participez
                  </span>
                  <Button variant="ghost" onClick={handleLeave} disabled={actionLoading}>
                    Je ne viens plus
                  </Button>
                </div>
              )}
              {isCreator && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex min-h-11 items-center rounded-full bg-violet-surface px-4 text-[15px] font-bold text-violet-strong">
                    Vous organisez cette sortie
                  </span>
                  <ButtonLink to={`/events/${event.id}/edit`} variant="ghost">
                    <Pencil size={18} aria-hidden="true" /> Modifier
                  </ButtonLink>
                  <Button variant="danger" onClick={handleDelete}>
                    <Trash2 size={18} aria-hidden="true" /> Supprimer
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 size={18} aria-hidden="true" /> Partager
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                downloadIcs(event);
                toast.success('Sortie ajoutée à votre agenda.');
              }}
            >
              <CalendarPlus size={18} aria-hidden="true" /> Ajouter à mon agenda
            </Button>
          </div>

          {error && <p className="mt-4 font-semibold text-danger-strong">{error}</p>}

          {event.description && (
            <section className="mt-8">
              <h2 className="mb-2 text-xl font-extrabold text-text">Le programme</h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-text-2">{event.description}</p>
            </section>
          )}

          {event.latitude != null && event.longitude != null && (
            <section className="mt-8">
              <h2 className="mb-2 text-xl font-extrabold text-text">Sur la carte</h2>
              {event.locationHidden && (
                <p className="mb-2 text-[15px] text-text-2">Position approximative, à un kilomètre près.</p>
              )}
              <div className="h-56 overflow-hidden rounded-2xl ring-1 ring-border">
                <MapContainer
                  center={[event.latitude, event.longitude]}
                  zoom={event.locationHidden ? 13 : 15}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[event.latitude, event.longitude]} />
                </MapContainer>
              </div>
            </section>
          )}

          {occurrences.length > 1 && (
            <section className="mt-8">
              <h2 className="mb-2 text-xl font-extrabold text-text">Toutes les dates</h2>
              <p className="mb-3 text-[15px] text-text-2">Cette sortie revient chaque semaine. Choisissez la date qui vous convient.</p>
              <div className="flex flex-wrap gap-2">
                {occurrences.map((o) => (
                  <Link
                    key={o.id}
                    to={`/events/${o.id}`}
                    className={`inline-flex min-h-11 items-center rounded-full border-2 px-4 text-[15px] font-bold capitalize transition-colors ${
                      o.id === event.id
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-border bg-surface text-text-2 hover:border-primary hover:text-primary-strong'
                    }`}
                  >
                    {new Date(o.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-xl font-extrabold text-text">
              Qui vient
              <span className="ml-2 text-base font-bold text-text-3">({confirmed.length})</span>
            </h2>
            {confirmed.length === 0 ? (
              <p className="text-[15px] text-text-2">
                {isAuthenticated ? "Personne pour l'instant : soyez le premier." : 'Connectez-vous pour voir qui participe.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {confirmed.map((p) => (
                  <Link
                    key={p.userId}
                    to={`/profile/${p.userId}`}
                    className="flex min-h-11 items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-4 ring-1 ring-border transition-colors hover:ring-primary"
                  >
                    <Avatar name={p.firstName} url={p.avatarUrl} size="sm" />
                    <span className="text-[15px] font-bold text-text">{p.firstName}</span>
                    {p.userId === event.creatorId && (
                      <span className="rounded-full bg-violet-surface px-2 py-0.5 text-xs font-bold text-violet-strong">
                        Organise
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {event.status === 'Completed' && isParticipant && (
            <section className="mt-8">
              <h2 className="mb-3 text-xl font-extrabold text-text">Comment ça s'est passé ?</h2>
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
                        <div className="flex items-center justify-between rounded-2xl bg-surface-sunken px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={p.firstName} url={p.avatarUrl} size="sm" />
                            <span className="text-[15px] font-bold text-text">{p.firstName}</span>
                          </div>
                          {ratedUsers.has(p.userId) ? (
                            <span className="text-[15px] font-bold text-success-strong">Noté ✓</span>
                          ) : (
                            <Button variant="secondary" size="sm" onClick={() => setRatingTarget(p.userId)}>
                              Donner une note
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          <EventComments eventId={event.id} creatorId={event.creatorId} />

          <EventGallery
            eventId={event.id}
            photos={event.photos}
            canAdd={isParticipant}
            currentUserId={user?.id}
            isCreator={isCreator}
            onChange={(photos) => setEvent({ ...event, photos })}
          />

          {isParticipant && event.status !== 'Cancelled' && <EventChat eventId={event.id} />}

          {!isCreator && (
            <div className="mt-8 flex justify-end">
              <ReportButton targetType="event" targetId={event.id} />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
