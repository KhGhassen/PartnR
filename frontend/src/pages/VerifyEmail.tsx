import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmEmail } from '../api/auth';

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
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-gray-500">Vérification en cours...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Email confirmé !</h1>
          <p className="text-gray-500 mb-6">Votre adresse email a bien été vérifiée.</p>
          <Link
            to="/"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Accéder à l'application
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold mb-2">Lien invalide ou expiré</h1>
        <p className="text-gray-500 mb-4">Ce lien de confirmation est invalide ou a expiré.</p>
        <Link to="/login" className="text-indigo-600 hover:underline text-sm block mb-2">
          Se connecter
        </Link>
        <p className="text-gray-400 text-xs">
          Connectez-vous et demandez un renvoi de l'email de confirmation depuis votre profil.
        </p>
      </div>
    </div>
  );
}
