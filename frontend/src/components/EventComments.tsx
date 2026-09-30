import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
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
    <section className="mt-8">
      <h2 className="mb-1 text-xl font-extrabold text-text">Une question ?</h2>
      <p className="mb-3 text-[15px] text-text-2">
        Posez-la ici avant de vous inscrire : l'organisateur répond, et tout le monde en profite.
      </p>

      {comments.length > 0 && (
        <div className="mb-4 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3 rounded-2xl bg-surface-sunken p-4">
              <Avatar name={c.userName} url={c.userAvatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[15px]">
                  <span className="font-bold text-text">{c.userName}</span>
                  {c.isOrganizer && (
                    <span className="rounded-full bg-violet-surface px-2 py-0.5 text-xs font-bold text-violet-strong">
                      Organise
                    </span>
                  )}
                  <span className="text-sm text-text-3">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
                <p className="mt-1 text-base text-text-2">{c.content}</p>
              </div>
              {(c.userId === user?.id || creatorId === user?.id) && (
                <button
                  onClick={() => handleDelete(c.id)}
                  aria-label="Supprimer la question"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-3 transition-colors hover:bg-surface hover:text-danger"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAuthenticated ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            maxLength={500}
            placeholder="Ex. : Faut-il apporter quelque chose ?"
            aria-label="Votre question"
            className={inputClass(false, 'flex-1')}
          />
          <Button onClick={handleSubmit} disabled={sending || !content.trim()}>
            {sending ? 'Envoi…' : 'Poser la question'}
          </Button>
        </div>
      ) : (
        <p className="text-[15px] text-text-2">
          <Link to="/login" className="font-bold text-primary-strong hover:underline">Connectez-vous</Link>{' '}
          pour poser une question.
        </p>
      )}
    </section>
  );
}
