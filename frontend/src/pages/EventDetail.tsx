import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEvent, joinEvent, leaveEvent, deleteEvent } from '../api/events';
import { useAuth } from '../context/AuthContext';
import { trackAction } from '../api/analytics';
import type { EventDetail as EventDetailType } from '../types';
import EventChat from '../components/EventChat';
import RatingForm from '../components/RatingForm';
import EventGallery from '../components/EventGallery';

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
  }, [id]);

  if (loading) return <p className="text-center py-12 text-gray-500">Chargement...</p>;
  if (error || !event) return <p className="text-center py-12 text-red-500">{error}</p>;

  const isCreator = user?.id === event.creatorId;
  const isParticipant = event.participants.some(
    (p) => p.userId === user?.id && p.status === 'Confirmed'
  );
  const isFull = event.participantCount >= event.maxParticipants;

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">
        ← Retour aux événements
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {event.photoUrl && (
          <img
            src={event.photoUrl}
            alt={event.title}
            className="w-full h-56 object-cover bg-gray-100"
          />
        )}
        <div className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{event.activityIcon}</span>
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-gray-500">{event.activityName}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
            event.status === 'Published' ? 'bg-green-100 text-green-700' :
            event.status === 'Completed' ? 'bg-gray-100 text-gray-600' :
            'bg-red-100 text-red-700'
          }`}>
            {event.status}
          </span>
        </div>

        {event.description && (
          <p className="text-gray-700 mb-6">{event.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-400">Ville</span>
            <p className="font-medium">{event.city}</p>
          </div>
          {event.location && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-400">Lieu</span>
              <p className="font-medium">{event.location}</p>
            </div>
          )}
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-400">Date</span>
            <p className="font-medium">
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
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-400">Participants</span>
            <p className="font-medium">
              {event.participantCount}/{event.maxParticipants}
              {isFull && <span className="text-red-500 ml-1">(Complet)</span>}
            </p>
          </div>
        </div>

        {/* Actions */}
        {isAuthenticated && (
          <div className="flex gap-3 mb-6">
            {!isParticipant && !isCreator && !isFull && event.status === 'Published' && (
              <button
                onClick={handleJoin}
                disabled={actionLoading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Rejoindre
              </button>
            )}
            {isParticipant && !isCreator && (
              <button
                onClick={handleLeave}
                disabled={actionLoading}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Quitter
              </button>
            )}
            {isCreator && (
              <>
                <Link
                  to={`/events/${event.id}/edit`}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                >
                  Modifier
                </Link>
                <button
                  onClick={handleDelete}
                  className="bg-red-100 text-red-600 px-6 py-2 rounded-lg hover:bg-red-200"
                >
                  Supprimer
                </button>
              </>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Participants */}
        <h2 className="text-lg font-semibold mb-3">Participants</h2>
        <div className="flex flex-wrap gap-3 mb-8">
          {event.participants
            .filter((p) => p.status === 'Confirmed')
            .map((p) => (
              <Link
                key={p.userId}
                to={`/profile/${p.userId}`}
                className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {p.firstName[0]}
                </div>
                <span className="text-sm">{p.firstName}</span>
                {p.userId === event.creatorId && (
                  <span className="text-xs text-indigo-500">Organisateur</span>
                )}
              </Link>
            ))}
        </div>

        {/* Ratings section — only for completed events */}
        {event.status === 'Completed' && isParticipant && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Noter les participants</h2>
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
                      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {p.firstName[0]}
                          </div>
                          <span className="text-sm font-medium">{p.firstName}</span>
                        </div>
                        {ratedUsers.has(p.userId) ? (
                          <span className="text-green-600 text-sm">Noté ✓</span>
                        ) : (
                          <button
                            onClick={() => setRatingTarget(p.userId)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Noter
                          </button>
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
