import { useRef, useState } from 'react';
import { addEventPhoto, deleteEventPhoto } from '../api/eventPhotos';
import { uploadImage } from '../api/uploads';
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { url } = await uploadImage(file);
      const photo = await addEventPhoto(eventId, { url });
      onChange([photo, ...photos]);
    } catch (err) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
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
        {canAdd && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="text-coral-600 hover:text-coral-700 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Envoi…' : '+ Ajouter une photo'}
            </button>
          </>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

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
