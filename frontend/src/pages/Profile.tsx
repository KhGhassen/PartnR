import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProfile, updateMyProfile } from '../api/profiles';
import { useAuth } from '../context/AuthContext';
import type { Profile as ProfileType } from '../types';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', city: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOwn = user?.id === id;

  useEffect(() => {
    setLoading(true);
    getProfile(id!)
      .then((p) => {
        setProfile(p);
        setForm({ firstName: p.firstName, city: p.city, bio: p.bio || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      setEditing(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-12 text-gray-500">Chargement...</p>;
  if (!profile) return <p className="text-center py-12 text-red-500">Profil introuvable.</p>;

  const stars = (rating: number) => {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {profile.firstName[0]}
          </div>
          <div>
            {editing ? (
              <input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="text-xl font-bold border border-gray-300 rounded px-2 py-1"
              />
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

        {profile.favoriteActivities.length > 0 && (
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
        )}

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
              onClick={() => setEditing(false)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
