import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { inputClass } from '../components/ui/classes';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <div className="mb-4 text-5xl">📧</div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">Email envoyé</h1>
          <p className="mb-6 text-sm text-ink-sub">
            Si un compte existe pour <span className="font-medium text-ink">{email}</span>,
            vous recevrez un lien de réinitialisation sous peu.
          </p>
          <Link to="/login" className="text-sm font-medium text-coral-600 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-card">
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-ink">Mot de passe oublié</h1>
        <p className="mb-6 text-center text-sm text-ink-sub">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
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
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="font-medium text-coral-600 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
