import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { inputClass } from '../components/ui/classes';

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
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <div className="mb-4 text-5xl">⚠️</div>
          <h1 className="mb-2 text-xl font-bold tracking-tight text-ink">Lien invalide</h1>
          <p className="mb-4 text-sm text-ink-sub">Ce lien de réinitialisation est invalide ou a expiré.</p>
          <Link to="/forgot-password" className="text-sm font-medium text-coral-600 hover:underline">
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
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">Mot de passe modifié</h1>
          <p className="mb-6 text-sm text-ink-sub">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          <Button size="lg" onClick={() => navigate('/login')} className="w-full">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-card">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-ink">Nouveau mot de passe</h1>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Field label="Nouveau mot de passe">
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass(false)}
              />
            </Field>
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => (
                  <p
                    key={rule.label}
                    className={`flex items-center gap-1 text-xs ${
                      rule.test(newPassword) ? 'text-emerald-600' : 'text-ink-sub'
                    }`}
                  >
                    {rule.test(newPassword) ? '✓' : '○'} {rule.label}
                  </p>
                ))}
              </div>
            )}
          </div>
          <Field label="Confirmer le mot de passe">
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={inputClass(false)}
            />
          </Field>
          <Button type="submit" size="lg" disabled={loading || !passwordValid} className="w-full">
            {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
          </Button>
        </form>
      </div>
    </div>
  );
}
