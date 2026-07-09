import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEventComments, addEventComment, deleteEventComment, type EventComment } from '../api/eventComments';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import { inputClass } from './ui/classes';

interface Props {
  eventId: string;
  creatorId: string;
}

export default function EventComments({ eventId, creatorId }: Props) {
  const auth = useAuth();
  const toast = useToast();
  const user = auth?.user;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [comments, setComments] = useState<EventComment[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await listEventComments(eventId);
        if (!cancelled) setComments(data);
      } catch {
        // silent — the section just stays empty
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const comment = await addEventComment(eventId, content.trim());
      setComments((cs) => [...cs, comment]);
      setContent('');
    } catch {
      toast.error("Impossible d'envoyer la question.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteEventComment(eventId, commentId);
      setComments((cs) => cs.filter((c) => c.id !== commentId));
    } catch {
      toast.error('Suppression impossible.');
    }
  };

  return (
    <div className="mb-8">
      <h2 className="mb-1 text-lg font-bold text-ink">Questions</h2>
      <p className="mb-3 text-sm text-ink-sub">
        Une question avant de rejoindre ? L'organisateur vous répond ici, visible par tous.
      </p>

      {comments.length > 0 && (
        <div className="mb-4 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3 rounded-2xl bg-cream p-4">
              <Avatar name={c.userName} url={c.userAvatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-ink">{c.userName}</span>
                  {c.isOrganizer && (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                      Organisateur
                    </span>
                  )}
                  <span className="text-xs text-ink-sub">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-ink-mid">{c.content}</p>
              </div>
              {(c.userId === user?.id || creatorId === user?.id) && (
                <button
                  onClick={() => handleDelete(c.id)}
                  aria-label="Supprimer"
                  className="text-xs text-ink-sub transition-colors hover:text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAuthenticated ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            maxLength={500}
            placeholder="Posez votre question…"
            className={inputClass(false, 'flex-1')}
          />
          <Button onClick={handleSubmit} disabled={sending || !content.trim()}>
            {sending ? 'Envoi…' : 'Envoyer'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-ink-sub">
          <Link to="/login" className="font-medium text-coral-600 hover:underline">Connectez-vous</Link>{' '}
          pour poser une question.
        </p>
      )}
    </div>
  );
}
