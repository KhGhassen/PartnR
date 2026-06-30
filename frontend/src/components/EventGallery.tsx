import { useState } from 'react';
import { addEventPhoto, deleteEventPhoto } from '../api/eventPhotos';
import type { EventPhoto } from '../types';

interface Props {
  eventId: string;
  photos: EventPhoto[];
  canAdd: boolean;
  currentUserId?: string;
  isCreator: boolean;
  onChange: (photos: EventPhoto[]) => void;
}

export default function EventGallery({ eventId, photos, canAdd, currentUserId, isCreator, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!url.trim()) {
      setError('Indiquez une URL');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const photo = await addEventPhoto(eventId, { url: url.trim() });
      onChange([photo, ...photos]);
      setUrl('');
      setAdding(false);
    } catch (err) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Supprimer cette photo ?')) return;
    try {
      await deleteEventPhoto(eventId, photoId);
      onChange(photos.filter((p) => p.id !== photoId));
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Photos de l'événement</h2>
        {canAdd && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            + Ajouter une photo
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL de la photo"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-3"
          />
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Ajouter'}
            </button>
            <button
              onClick={() => { setAdding(false); setUrl(''); setError(''); }}
              className="text-gray-500 hover:text-gray-700 text-sm px-3"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune photo pour l'instant.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative group">
              <img
                src={p.url}
                alt="Photo de l'événement"
                className="w-full h-32 object-cover rounded-lg bg-gray-100"
              />
              {(p.uploaderId === currentUserId || isCreator) && (
                <button
                  onClick={() => handleDelete(p.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Supprimer la photo"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
