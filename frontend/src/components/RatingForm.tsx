import { useState } from 'react';
import { createRating } from '../api/ratings';
import Button from './ui/Button';
import { inputClass } from './ui/classes';

interface Props {
  eventId: string;
  ratedUserId: string;
  ratedUserName: string;
  onRated: () => void;
  onCancel: () => void;
}

export default function RatingForm({ eventId, ratedUserId, ratedUserName, onRated, onCancel }: Props) {
  const [score, setScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (score === 0) {
      setError('Sélectionnez une note');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createRating(eventId, {
        ratedUserId,
        score,
        comment: comment.trim() || undefined,
      });
      onRated();
    } catch (err) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Erreur lors de la notation');
    } finally {
      setLoading(false);
    }
  };

  const displayScore = hoveredScore || score;

  return (
    <div className="rounded-2xl bg-surface-sunken p-4 ring-1 ring-border">
      <p className="mb-3 text-base font-bold text-text">
        Noter <span className="text-primary-strong">{ratedUserName}</span>
      </p>

      <div className="mb-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScore(s)}
            onMouseEnter={() => setHoveredScore(s)}
            onMouseLeave={() => setHoveredScore(0)}
            className={`h-11 w-11 text-3xl transition-transform hover:scale-110 ${s <= displayScore ? 'text-sun' : 'text-border-strong'}`}
            aria-label={`${s} étoile${s > 1 ? 's' : ''}`}
          >
            {s <= displayScore ? '★' : '☆'}
          </button>
        ))}
        {displayScore > 0 && (
          <span className="ml-2 self-center text-[15px] font-bold text-text-2">{displayScore}/5</span>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Un mot (facultatif)"
        maxLength={500}
        rows={2}
        aria-label="Commentaire"
        className={inputClass(false, 'mb-3 resize-none')}
      />

      {error && <p className="mb-2 text-sm font-semibold text-danger-strong">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={loading || score === 0}>
          {loading ? 'Envoi...' : 'Envoyer'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
