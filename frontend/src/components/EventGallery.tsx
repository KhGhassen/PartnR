import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { addEventPhoto, deleteEventPhoto } from '../api/eventPhotos';
import { uploadImage } from '../api/uploads';
import Button from './ui/Button';
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

  if (photos.length === 0 && !canAdd) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-text">Photos</h2>
        {canAdd && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={loading}>
              <ImagePlus size={18} aria-hidden="true" /> {loading ? 'Envoi…' : 'Ajouter une photo'}
            </Button>
          </>
        )}
      </div>

      {error && <p className="mb-2 text-sm font-semibold text-danger-strong">{error}</p>}

      {photos.length === 0 ? (
        <p className="text-[15px] text-text-2">Aucune photo pour l'instant. Les participants peuvent en ajouter après la sortie.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="group relative">
              <img
                src={p.url}
                alt="Photo de la sortie"
                className="h-36 w-full rounded-2xl bg-surface-sunken object-cover"
              />
              {(p.uploaderId === currentUserId || isCreator) && (
                <button
                  onClick={() => handleDelete(p.id)}
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-text/70 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label="Supprimer la photo"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
