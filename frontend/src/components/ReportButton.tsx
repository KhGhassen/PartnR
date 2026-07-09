import { useState } from 'react';
import { createReport } from '../api/reports';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from './ui/Button';
import { inputClass } from './ui/classes';

interface Props {
  targetType: 'user' | 'event';
  targetId: string;
}

export default function ReportButton({ targetType, targetId }: Props) {
  const isAuthenticated = useAuth()?.isAuthenticated ?? false;
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  if (!isAuthenticated) return null;

  const submit = async () => {
    if (reason.trim().length < 10) {
      toast.error('Décrivez le problème en quelques mots (10 caractères min).');
      return;
    }
    setSending(true);
    try {
      await createReport({ targetType, targetId, reason: reason.trim() });
      toast.success('Signalement envoyé. Merci, nous allons y jeter un œil.');
      setOpen(false);
      setReason('');
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg || "Impossible d'envoyer le signalement.");
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ink-sub transition-colors hover:text-red-500"
      >
        🚩 Signaler
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-line bg-cream p-4">
      <p className="mb-2 text-sm font-semibold text-ink">
        Signaler {targetType === 'event' ? 'cet événement' : 'ce profil'}
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Décrivez le problème…"
        className={inputClass(false, 'mb-2 resize-none')}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="danger" onClick={submit} disabled={sending}>
          {sending ? 'Envoi…' : 'Envoyer le signalement'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
