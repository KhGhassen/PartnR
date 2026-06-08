import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { resendConfirmation } from '../api/auth';
import { toApiError } from '../api/client';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  if (!user || user.emailConfirmed || dismissed) return null;

  const handleResend = async () => {
    setStatus('sending');
    setError('');
    try {
      await resendConfirmation(user.email);
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(toApiError(err).message);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <p>
          Confirmez votre adresse email pour profiter pleinement de PartnR.
          {status === 'sent' && (
            <span className="font-medium"> Email envoyé, vérifiez votre boîte de réception.</span>
          )}
          {status === 'error' && <span className="font-medium text-red-600"> {error}</span>}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleResend}
            disabled={status === 'sending' || status === 'sent'}
            className="text-amber-900 font-medium hover:underline disabled:opacity-50"
          >
            {status === 'sending' ? 'Envoi...' : "Renvoyer l'email"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Fermer"
            className="text-amber-600 hover:text-amber-900"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
