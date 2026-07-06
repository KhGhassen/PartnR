import { useRef, useState } from 'react';
import { uploadImage } from '../api/uploads';
import { toApiError } from '../api/client';

interface PhotoInputProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export default function PhotoInput({ value, onChange, placeholder = 'Choisir une image' }: PhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    setUploading(true);
    setError('');
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt="" className="h-20 w-32 rounded-2xl border border-line object-cover bg-cream-deep" />
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Retirer la photo"
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white transition-colors hover:bg-red-500"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-32 flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-line bg-cream text-ink-sub transition-colors hover:border-coral-300 hover:text-coral-600 disabled:opacity-50"
          >
            <span className="text-xl">📷</span>
            <span className="text-xs font-medium">{uploading ? 'Envoi…' : placeholder}</span>
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-sm font-medium text-coral-600 hover:underline disabled:opacity-50"
          >
            {uploading ? 'Envoi…' : 'Changer'}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
