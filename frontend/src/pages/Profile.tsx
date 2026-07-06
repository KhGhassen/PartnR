import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProfile, updateMyProfile, getRatingsForUser } from '../api/profiles';
import { listActivities } from '../api/activities';
import { listCities } from '../api/cities';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ChangePasswordForm from '../components/ChangePasswordForm';
import PhotoInput from '../components/PhotoInput';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import { inputClass } from '../components/ui/classes';
import type { Activity, Profile as ProfileType, RatingDto } from '../types';

const PROFILE_TYPES = [
  { value: 'Aventurier', label: 'Aventurier' },
  { value: 'Social', label: 'Social' },
  { value: 'Detente', label: 'Détente' },
  { value: 'Sportif', label: 'Sportif' },
  { value: 'Creatif', label: 'Créatif' },
  { value: 'Calme', label: 'Calme' },
];

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', city: '', bio: '', avatarUrl: '', favoriteActivities: [] as string[], profileType: '' });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<string[]>([]);
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
          profileType: p.profileType || '',
        });
      })
      .catch(() => setError('Impossible de charger le profil.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (isOwn) {
      listActivities().then(setActivities).catch(() => {});
      listCities().then(setCities).catch(() => {});
    }
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
      profileType: profile!.profileType || '',
    });
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateMyProfile({ ...form, profileType: form.profileType || null });
      setProfile(updated);
      setEditing(false);
      toast.success('Profil mis à jour.');
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-16 text-center text-ink-sub">Chargement...</p>;
  if (error && !profile) return <p className="py-16 text-center text-red-500">{error}</p>;
  if (!profile) return <p className="py-16 text-center text-red-500">Profil introuvable.</p>;

  const stars = (rating: number) => {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        {/* Brand band */}
        <div className="h-20 bg-gradient-to-r from-coral-500 to-violet-500" />

        <div className="p-8 pt-0">
          <div className="mb-6 flex items-end gap-4">
            <div className="-mt-8">
              <Avatar
                name={profile.firstName}
                url={editing ? form.avatarUrl || null : profile.avatarUrl}
                size="lg"
                className="ring-4 ring-white"
              />
            </div>
            <div className="flex-1 pt-2">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className={inputClass(false, 'max-w-xs font-bold')}
                  />
                  <PhotoInput
                    value={form.avatarUrl}
                    onChange={(url) => setForm((f) => ({ ...f, avatarUrl: url }))}
                    placeholder="Photo de profil"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight text-ink">{profile.firstName}</h1>
                  <p className="text-sm text-ink-sub">
                    Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                </>
              )}
            </div>
            {isOwn && !editing && (
              <Button variant="soft" size="sm" onClick={() => setEditing(true)}>
                Modifier
              </Button>
            )}
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-cream p-4">
              <p className="mb-0.5 text-xs text-ink-sub">Ville</p>
              {editing ? (
                <select
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className={inputClass(false, 'mt-1')}
                >
                  <option value="">Sélectionner une ville</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <p className="font-semibold text-ink">📍 {profile.city}</p>
              )}
            </div>
            <div className="rounded-2xl bg-cream p-4">
              <p className="mb-0.5 text-xs text-ink-sub">Note</p>
              <p className="font-semibold text-ink">
                <span className="text-amber-500">{stars(profile.ratingAvg)}</span>
                <span className="ml-1 text-sm font-normal text-ink-sub">({profile.ratingCount} avis)</span>
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-1.5 text-xs font-semibold text-ink-mid">Bio</h2>
            {editing ? (
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                maxLength={300}
                rows={3}
                className={inputClass(false, 'resize-none')}
              />
            ) : (
              <p className="text-ink-mid">{profile.bio || 'Pas encore de bio.'}</p>
            )}
          </div>

          {editing ? (
            <div className="mb-6">
              <h2 className="mb-2 text-xs font-semibold text-ink-mid">Catégorie de profil</h2>
              <div className="flex flex-wrap gap-2">
                {PROFILE_TYPES.map((pt) => {
                  const active = form.profileType === pt.value;
                  return (
                    <Chip
                      key={pt.value}
                      active={active}
                      onClick={() => setForm((f) => ({ ...f, profileType: active ? '' : pt.value }))}
                    >
                      {pt.label}
                    </Chip>
                  );
                })}
              </div>
            </div>
          ) : (
            profile.profileType && (
              <div className="mb-6">
                <h2 className="mb-2 text-xs font-semibold text-ink-mid">Catégorie de profil</h2>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
                  {PROFILE_TYPES.find((pt) => pt.value === profile.profileType)?.label || profile.profileType}
                </span>
              </div>
            )
          )}

          {editing ? (
            <div className="mb-6">
              <h2 className="mb-2 text-xs font-semibold text-ink-mid">Activités favorites</h2>
              <div className="flex flex-wrap gap-2">
                {activities.map((a) => (
                  <Chip
                    key={a.id}
                    active={form.favoriteActivities.includes(a.name)}
                    onClick={() => toggleFavoriteActivity(a.name)}
                  >
                    {a.icon} {a.name}
                  </Chip>
                ))}
              </div>
            </div>
          ) : (
            profile.favoriteActivities.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-2 text-xs font-semibold text-ink-mid">Activités favorites</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.favoriteActivities.map((a) => (
                    <span key={a} className="rounded-full bg-coral-50 px-3 py-1 text-sm font-medium text-coral-700">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )
          )}

          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

          {editing && (
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                Annuler
              </Button>
            </div>
          )}
        </div>
      </div>

      {isOwn && (
        <div className="mt-6 rounded-3xl border border-line bg-white p-8 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Sécurité</h2>
            {!changingPassword && (
              <Button variant="soft" size="sm" onClick={() => setChangingPassword(true)}>
                Changer le mot de passe
              </Button>
            )}
          </div>
          {changingPassword ? (
            <ChangePasswordForm onClose={() => setChangingPassword(false)} />
          ) : (
            <p className="text-sm text-ink-sub">Modifiez votre mot de passe à tout moment.</p>
          )}
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-line bg-white p-8 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-ink">Avis reçus</h2>
        {ratings.length === 0 ? (
          <p className="text-sm text-ink-sub">Aucun avis pour l'instant.</p>
        ) : (
          <div className="space-y-4">
            {ratings.map((r) => (
              <div key={r.id} className="rounded-2xl bg-cream p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{r.raterName}</span>
                  <span className="text-xs text-ink-sub">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <span className="text-sm text-amber-500">{stars(r.score)}</span>
                {r.comment && <p className="mt-1 text-sm text-ink-mid">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
