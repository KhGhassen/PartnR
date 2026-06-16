import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProfile, updateMyProfile, getRatingsForUser } from '../api/profiles';
import { listActivities } from '../api/activities';
import { useAuth } from '../context/AuthContext';
import ChangePasswordForm from '../components/ChangePasswordForm';
import type { Activity, Profile as ProfileType, RatingDto } from '../types';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', city: '', bio: '', avatarUrl: '', favoriteActivities: [] as string[] });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [ratings, setRatings] = useState<RatingDto[]>([]);

  const isOwn = user?.id === id;

  useEffect(() => {
    setLoading(true);
    setError('');
    getProfile(id!)
      .then((p) => {
        setProfile(p);
        setForm({
          firstName: p.firstName,
          city: p.city,
          bio: p.bio || '',
          avatarUrl: p.avatarUrl || '',
          favoriteActivities: p.favoriteActivities,
        });
      })
      .catch(() => setError('Impossible de charger le profil.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (isOwn) listActivities().then(setActivities).catch(() => {});
  }, [isOwn]);

  useEffect(() => {
    if (id) getRatingsForUser(id).then(setRatings).catch(() => {});
  }, [id]);

  const toggleFavoriteActivity = (name: string) =>
    setForm((f) => ({
      ...f,
      favoriteActivities: f.favoriteActivities.includes(name)
        ? f.favoriteActivities.filter((a) => a !== name)
        : [...f.favoriteActivities, name],
    }));

  const handleCancel = () => {
    setForm({
      firstName: profile!.firstName,
      city: profile!.city,
      bio: profile!.bio || '',
      avatarUrl: profile!.avatarUrl || '',
      favoriteActivities: profile!.favoriteActivities,
    });
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      setEditing(false);
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-12 text-gray-500">Chargement...</p>;
  if (error && !profile) return <p className="text-center py-12 text-red-500">{error}</p>;
  if (!profile) return <p className="text-center py-12 text-red-500">Profil introuvable.</p>;

  const stars = (rating: number) => {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          {(editing ? form.avatarUrl : profile.avatarUrl) ? (
            <img
              src={editing ? form.avatarUrl : profile.avatarUrl!}
              alt={profile.firstName}
              className="w-16 h-16 rounded-full object-cover bg-gray-100"
            />
          ) : (
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {profile.firstName[0]}
            </div>
          )}
          <div className="flex-1">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="text-xl font-bold border border-gray-300 rounded px-2 py-1"
                />
                <input
                  value={form.avatarUrl}
                  onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="URL de la photo de profil (optionnel)"
                  className="block w-full text-sm border border-gray-300 rounded px-2 py-1 text-gray-600"
                />
              </div>
            ) : (
              <h1 className="text-2xl font-bold">{profile.firstName}</h1>
            )}
            <p className="text-gray-500">
              Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          {isOwn && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="ml-auto text-sm text-indigo-600 hover:underline"
            >
              Modifier
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <span className="text-sm text-gray-400">Ville</span>
            {editing ? (
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="block w-full border border-gray-300 rounded px-2 py-1 mt-1"
              />
            ) : (
              <p className="font-medium">{profile.city}</p>
            )}
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <span className="text-sm text-gray-400">Note</span>
            <p className="font-medium">
              <span className="text-yellow-500">{stars(profile.ratingAvg)}</span>
              <span className="text-gray-400 text-sm ml-1">
                ({profile.ratingCount} avis)
              </span>
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm text-gray-400 mb-1">Bio</h2>
          {editing ? (
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              maxLength={300}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none"
            />
          ) : (
            <p className="text-gray-700">{profile.bio || 'Pas encore de bio.'}</p>
          )}
        </div>

        {editing ? (
          <div className="mb-6">
            <h2 className="text-sm text-gray-400 mb-2">Activités favorites</h2>
            <div className="flex flex-wrap gap-2">
              {activities.map((a) => {
                const active = form.favoriteActivities.includes(a.name);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleFavoriteActivity(a.name)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {a.icon} {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          profile.favoriteActivities.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm text-gray-400 mb-2">Activités favorites</h2>
              <div className="flex flex-wrap gap-2">
                {profile.favoriteActivities.map((a) => (
                  <span key={a} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {editing && (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {isOwn && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">Sécurité</h2>
            {!changingPassword && (
              <button
                onClick={() => setChangingPassword(true)}
                className="text-sm text-indigo-600 hover:underline"
              >
                Changer le mot de passe
              </button>
            )}
          </div>
          {changingPassword ? (
            <ChangePasswordForm onClose={() => setChangingPassword(false)} />
          ) : (
            <p className="text-sm text-gray-500">Modifiez votre mot de passe à tout moment.</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-8 mt-6">
        <h2 className="text-lg font-bold mb-4">Avis reçus</h2>
        {ratings.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun avis pour l'instant.</p>
        ) : (
          <div className="space-y-4">
            {ratings.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{r.raterName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <span className="text-yellow-500 text-sm">{stars(r.score)}</span>
                {r.comment && (
                  <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
