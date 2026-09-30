import { useState, type FormEvent } from 'react';
import { changePassword } from '../api/auth';
import { toApiError } from '../api/client';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8 caractères minimum' },
  { test: (p: string) => /[A-Z]/.test(p), label: '1 majuscule' },
  { test: (p: string) => /\d/.test(p), label: '1 chiffre' },
];

export default function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordValid = PASSWORD_RULES.every((r) => r.test(newPassword));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      setError('Le nouveau mot de passe ne respecte pas les critères.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-success-surface p-4 text-[15px] font-semibold text-success-strong">
        <span>Mot de passe modifié avec succès.</span>
        <button onClick={onClose} className="font-bold text-success-strong underline">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="bg-danger-surface text-danger-strong rounded-2xl p-3 text-sm font-semibold">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-text-2 mb-1">Mot de passe actuel</label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-2xl border-2 border-border-input px-4 py-3 text-base outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-2 mb-1">Nouveau mot de passe</label>
        <input
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-2xl border-2 border-border-input px-4 py-3 text-base outline-none focus:border-primary"
        />
        {newPassword.length > 0 && (
          <div className="mt-2 space-y-1">
            {PASSWORD_RULES.map((rule) => (
              <p
                key={rule.label}
                className={`text-sm flex items-center gap-1 ${
                  rule.test(newPassword) ? 'text-success-strong' : 'text-text-3'
                }`}
              >
                {rule.test(newPassword) ? '✓' : '○'} {rule.label}
              </p>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-2 mb-1">Confirmer le nouveau mot de passe</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-2xl border-2 border-border-input px-4 py-3 text-base outline-none focus:border-primary"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !passwordValid}
          className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-12 items-center rounded-full border-2 border-border bg-surface px-6 font-bold text-text hover:border-border-strong"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
