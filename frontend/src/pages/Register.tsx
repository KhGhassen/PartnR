import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { register, resendConfirmation } from '../api/auth';
import { toApiError } from '../api/client';
import { safeRedirect } from '../lib/redirect';
import { useAuth } from '../context/AuthContext';
import { trackAction } from '../api/analytics';
import CityPicker from '../components/CityPicker';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { inputClass } from '../components/ui/classes';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8 caractères minimum' },
  { test: (p: string) => /[A-Z]/.test(p), label: '1 majuscule' },
  { test: (p: string) => /\d/.test(p), label: '1 chiffre' },
];

export default function Register() {
  const [form, setForm] = useState({ firstName: '', email: '', password: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resent, setResent] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));

  const passwordValid = PASSWORD_RULES.every((r) => r.test(form.password));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      setError('Le mot de passe ne respecte pas les critères');
      return;
    }
    // Typing "Lyo" without picking a suggestion leaves city empty; the server
    // then rejected it and the screen showed a generic error that never named
    // the field — the number one friction on the very first step.
    if (!form.city.trim()) {
      setError('Choisissez votre ville dans la liste de suggestions.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await register(form);
      setAuth(res.token, res.user);
      trackAction({ action: 'user_registered', entityType: 'user', entityId: res.user.id });
      setRegistered(true);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmation(form.email);
      setResent(true);
    } catch {
      // fail silently
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (registered) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mb-4 text-5xl">📬</div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">Vérifiez votre email</h1>
          <p className="mb-6 text-sm text-ink-sub">
            Un lien de confirmation a été envoyé à <span className="font-medium text-ink">{form.email}</span>.
            Cliquez sur ce lien pour activer votre compte.
          </p>
          {resent ? (
            <p className="mb-4 text-sm text-emerald-600">Email renvoyé !</p>
          ) : (
            <button
              onClick={handleResend}
              className="mx-auto mb-4 block text-sm font-medium text-coral-600 hover:underline"
            >
              Renvoyer l'email
            </button>
          )}
          <Button size="lg" onClick={() => navigate(redirect, { replace: true })} className="w-full">
            Accéder à l'application
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Inscription</h1>
      <p className="mb-6 text-sm text-ink-sub">Rejoignez la communauté en 30 secondes.</p>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Prénom">
          <input
            type="text"
            required
            maxLength={50}
            value={form.firstName}
            onChange={update('firstName')}
            placeholder="Votre prénom"
            className={inputClass(false)}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            value={form.email}
            onChange={update('email')}
            placeholder="vous@exemple.fr"
            className={inputClass(false)}
          />
        </Field>
        <div>
          <Field label="Mot de passe">
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
              placeholder="••••••••"
              className={inputClass(false)}
            />
          </Field>
          {form.password.length > 0 && (
            <div className="mt-2 space-y-1">
              {PASSWORD_RULES.map((rule) => (
                <p
                  key={rule.label}
                  className={`flex items-center gap-1 text-xs ${
                    rule.test(form.password) ? 'text-emerald-600' : 'text-ink-sub'
                  }`}
                >
                  {rule.test(form.password) ? '✓' : '○'} {rule.label}
                </p>
              ))}
            </div>
          )}
          {form.password.length === 0 && (
            <p className="mt-1 text-xs text-ink-sub">Min. 8 caractères, 1 majuscule, 1 chiffre</p>
          )}
        </div>
        <Field label="Ville">
          <CityPicker
            value={form.city}
            onChange={(c) => setForm((prev) => ({ ...prev, city: c.name }))}
          />
        </Field>
        <Button type="submit" size="lg" disabled={loading || !passwordValid} className="w-full">
          {loading ? 'Inscription...' : "S'inscrire"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-sub">
        Déjà un compte ?{' '}
        <Link to="/login" className="font-semibold text-coral-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}
