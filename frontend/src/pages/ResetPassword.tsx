import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8 caractères minimum' },
  { test: (p: string) => /[A-Z]/.test(p), label: '1 majuscule' },
  { test: (p: string) => /\d/.test(p), label: '1 chiffre' },
];

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email') ?? '';
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordValid = PASSWORD_RULES.every((r) => r.test(newPassword));

  if (!email || !token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
          <p className="text-gray-500 mb-4">Ce lien de réinitialisation est invalide ou a expiré.</p>
          <Link to="/forgot-password" className="text-indigo-600 hover:underline text-sm">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      setError('Le mot de passe ne respecte pas les critères');
      return;
    }
    if (newPassword !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword({ email, token, newPassword });
      setSuccess(true);
    } catch (err) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Lien invalide ou expiré. Demandez un nouveau lien.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Mot de passe modifié</h1>
          <p className="text-gray-500 mb-6">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Nouveau mot de passe</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => (
                  <p
                    key={rule.label}
                    className={`text-xs flex items-center gap-1 ${
                      rule.test(newPassword) ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {rule.test(newPassword) ? '✓' : '○'} {rule.label}
                  </p>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !passwordValid}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
