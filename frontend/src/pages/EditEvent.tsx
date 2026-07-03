import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, updateEvent } from '../api/events';
import { listCities } from '../api/cities';
import { useAuth } from '../context/AuthContext';
import LocationPicker from '../components/LocationPicker';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import Field from '../components/ui/Field';
import { inputClass } from '../components/ui/classes';

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    city: '',
    location: '',
    date: '',
    maxParticipants: 5,
    status: 'Published',
    photoUrl: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    listCities().then(setCities).catch(() => {});

    getEvent(id!).then((ev) => {
      if (ev.creatorId !== user?.id) {
        navigate(`/events/${id}`);
        return;
      }
      setForm({
        title: ev.title,
        description: ev.description || '',
        city: ev.city,
        location: ev.location || '',
        date: new Date(ev.date).toISOString().slice(0, 16),
        maxParticipants: ev.maxParticipants,
        status: ev.status,
        photoUrl: ev.photoUrl || '',
        latitude: ev.latitude,
        longitude: ev.longitude,
      });
    }).catch(() => {
      setError('Événement introuvable.');
    }).finally(() => {
      setPageLoading(false);
    });
  }, [id, isAuthenticated, user, navigate]);

  const set = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(field, e.target.value);

  const updateLocation = (lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (form.title.length < 3) errors.title = 'Le titre doit contenir au moins 3 caractères';
    if (!form.city.trim()) errors.city = 'La ville est requise';
    if (form.date && form.status === 'Published' && new Date(form.date) < new Date()) {
      errors.date = 'La date doit être dans le futur';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setLoading(true);
    try {
      await updateEvent(id!, {
        title: form.title,
        description: form.description || undefined,
        city: form.city,
        location: form.location || undefined,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        maxParticipants: Number(form.maxParticipants),
        status: form.status,
        photoUrl: form.photoUrl || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
      });
      navigate(`/events/${id}`);
    } catch (err) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <p className="py-16 text-center text-ink-sub">Chargement...</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">Modifier l'événement</h1>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-line bg-white p-8 shadow-card">
        <Field label="Titre" error={validationErrors.title}>
          <input
            type="text"
            required
            minLength={3}
            maxLength={100}
            value={form.title}
            onChange={update('title')}
            className={inputClass(!!validationErrors.title)}
          />
        </Field>

        <Field label="Description">
          <textarea
            maxLength={1000}
            value={form.description}
            onChange={update('description')}
            rows={3}
            className={inputClass(false, 'resize-none')}
          />
        </Field>

        <Field label="Photo de couverture (URL)">
          <input
            type="text"
            value={form.photoUrl}
            onChange={update('photoUrl')}
            placeholder="https://…"
            className={inputClass(false)}
          />
        </Field>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-mid">Ville</label>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <Chip key={c} active={form.city === c} onClick={() => set('city', c)}>
                {c}
              </Chip>
            ))}
          </div>
          {validationErrors.city && <p className="mt-1 text-xs text-red-500">{validationErrors.city}</p>}
        </div>

        <Field label="Lieu / Point de RDV">
          <input
            type="text"
            value={form.location}
            onChange={update('location')}
            className={inputClass(false)}
          />
        </Field>

        <Field label="Localisation sur la carte">
          <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={updateLocation} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date et heure" error={validationErrors.date}>
            <input
              type="datetime-local"
              required
              value={form.date}
              onChange={update('date')}
              className={inputClass(!!validationErrors.date)}
            />
          </Field>
          <Field label="Max participants">
            <input
              type="number"
              required
              min={2}
              max={50}
              value={form.maxParticipants}
              onChange={update('maxParticipants')}
              className={inputClass(false)}
            />
          </Field>
        </div>

        <Field label="Statut">
          <select value={form.status} onChange={update('status')} className={inputClass(false)}>
            <option value="Published">Publié</option>
            <option value="Cancelled">Annulé</option>
            <option value="Completed">Terminé</option>
          </select>
        </Field>

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={loading} className="flex-1">
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => navigate(`/events/${id}`)}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
