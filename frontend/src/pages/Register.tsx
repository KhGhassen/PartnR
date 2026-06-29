import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, resendConfirmation } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { trackAction } from '../api/analytics';
import { listCities } from '../api/cities';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8 caractères minimum' },
  { test: (p: string) => /[A-Z]/.test(p), label: '1 majuscule' },
  { test: (p: string) => /\d/.test(p), label: '1 chiffre' },
];

export default function Register() {
  const [form, setForm] = useState({ firstName: '', email: '', password: '', city: '' });
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resent, setResent] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    listCities().then(setCities).catch(() => {});
  }, []);

  const passwordValid = PASSWORD_RULES.every((r) => r.test(form.password));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      setError('Le mot de passe ne respecte pas les critères');
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
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || "Erreur lors de l'inscription");
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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-bold mb-2">Vérifiez votre email</h1>
          <p className="text-gray-500 mb-6">
            Un lien de confirmation a été envoyé à <span className="font-medium text-gray-800">{form.email}</span>.
            Cliquez sur ce lien pour activer votre compte.
          </p>
          {resent ? (
            <p className="text-green-600 text-sm mb-4">Email renvoyé !</p>
          ) : (
            <button
              onClick={handleResend}
              className="text-indigo-600 hover:underline text-sm mb-4 block mx-auto"
            >
              Renvoyer l'email
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
          >
            Accéder à l'application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Inscription</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            <input
              type="text"
              required
              maxLength={50}
              value={form.firstName}
              onChange={update('firstName')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            {form.password.length > 0 && (
              <div className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => (
                  <p
                    key={rule.label}
                    className={`text-xs flex items-center gap-1 ${
                      rule.test(form.password) ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {rule.test(form.password) ? '✓' : '○'} {rule.label}
                  </p>
                ))}
              </div>
            )}
            {form.password.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Min. 8 caractères, 1 majuscule, 1 chiffre</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <select
              required
              value={form.city}
              onChange={update('city')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Sélectionner une ville</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !passwordValid}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
