import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmEmail } from '../api/auth';
import { ButtonLink } from '../components/ui/Button';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const userId = params.get('userId') ?? '';
  const token = params.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    () => (!userId || !token ? 'error' : 'loading')
  );

  useEffect(() => {
    if (!userId || !token) return;
    confirmEmail({ userId, token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [userId, token]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <p className="text-ink-sub">Vérification en cours...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">Email confirmé !</h1>
          <p className="mb-6 text-sm text-ink-sub">Votre adresse email a bien été vérifiée.</p>
          <ButtonLink to="/" size="lg">Accéder à l'application</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
        <div className="mb-4 text-5xl">⚠️</div>
        <h1 className="mb-2 text-xl font-bold tracking-tight text-ink">Lien invalide ou expiré</h1>
        <p className="mb-4 text-sm text-ink-sub">Ce lien de confirmation est invalide ou a expiré.</p>
        <Link to="/login" className="mb-2 block text-sm font-medium text-coral-600 hover:underline">
          Se connecter
        </Link>
        <p className="text-xs text-ink-sub">
          Connectez-vous et demandez un renvoi de l'email de confirmation depuis votre profil.
        </p>
      </div>
    </div>
  );
}
