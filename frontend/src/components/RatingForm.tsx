import { useState } from 'react';
import { createRating } from '../api/ratings';

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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la notation');
    } finally {
      setLoading(false);
    }
  };

  const displayScore = hoveredScore || score;

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <p className="text-sm font-medium mb-3">
        Noter <span className="text-indigo-600">{ratedUserName}</span>
      </p>

      {/* Stars */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScore(s)}
            onMouseEnter={() => setHoveredScore(s)}
            onMouseLeave={() => setHoveredScore(0)}
            className="text-2xl transition-transform hover:scale-110"
            aria-label={`${s} étoile${s > 1 ? 's' : ''}`}
          >
            {s <= displayScore ? '★' : '☆'}
          </button>
        ))}
        {displayScore > 0 && (
          <span className="text-sm text-gray-500 ml-2 self-center">{displayScore}/5</span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Commentaire (optionnel)"
        maxLength={500}
        rows={2}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-3"
      />

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading || score === 0}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Envoi...' : 'Envoyer'}
        </button>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-sm px-3"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
