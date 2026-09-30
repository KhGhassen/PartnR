import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../api/auth';
import { toApiError } from '../api/client';
import { safeRedirect } from '../lib/redirect';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { inputClass } from '../components/ui/classes';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ email, password });
      setAuth(res.token, res.user);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="mb-1 text-3xl font-extrabold text-text">Content de vous revoir</h1>
      <p className="mb-6 text-base text-text-2">Connectez-vous pour retrouver vos sorties.</p>

      {error && (
        <div className="mb-4 rounded-2xl bg-danger-surface px-4 py-3 font-semibold text-danger-strong">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.fr"
            className={inputClass(false)}
          />
        </Field>
        <Field label="Mot de passe">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass(false)}
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-[15px] font-bold text-primary-strong hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>

      <p className="mt-6 text-center text-base text-text-2">
        Pas encore de compte ?{' '}
        <Link
          to={redirect !== '/' ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'}
          className="font-bold text-primary-strong hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  );
}
