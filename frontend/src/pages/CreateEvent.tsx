import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api/events';
import { listActivities } from '../api/activities';
import { listCities } from '../api/cities';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { trackAction } from '../api/analytics';
import LocationPicker from '../components/LocationPicker';
import CityPicker from '../components/CityPicker';
import PhotoInput from '../components/PhotoInput';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import Field from '../components/ui/Field';
import { inputClass } from '../components/ui/classes';
import type { Activity } from '../types';

export default function CreateEvent() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    city: '',
    location: '',
    date: '',
    maxParticipants: 5,
    activityId: '',
    photoUrl: '',
    latitude: null as number | null,
    longitude: null as number | null,
    recurrenceWeeks: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    listActivities().then(setActivities).catch(() => {});
    listCities().then(setCities).catch(() => {});
  }, [isAuthenticated, navigate]);

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
    if (form.title.trim().length < 3) errors.title = 'Le titre doit contenir au moins 3 caractères';
    if (!form.city.trim()) errors.city = 'La ville est requise';
    if (!form.date) errors.date = 'La date est requise';
    else if (new Date(form.date) < new Date()) errors.date = 'La date doit être dans le futur';
    if (!form.activityId) errors.activityId = 'Choisissez une activité';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setLoading(true);
    try {
      const ev = await createEvent({
        ...form,
        maxParticipants: Number(form.maxParticipants),
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        recurrenceWeeks: form.recurrenceWeeks >= 2 ? form.recurrenceWeeks : undefined,
      });
      trackAction({ action: 'event_created', entityType: 'event', entityId: ev.id });
      toast.success('Événement créé 🎉');
      navigate(`/events/${ev.id}`);
    } catch (err) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-3xl font-bold tracking-tight text-ink">Créer un événement</h1>
      <p className="mb-6 text-ink-sub">Proposez une activité et trouvez des partenaires.</p>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-line bg-white p-8 shadow-card">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-mid">Activité</label>
          <div className="flex flex-wrap gap-2">
            {activities.map((a) => (
              <Chip
                key={a.id}
                active={form.activityId === a.id}
                onClick={() => set('activityId', a.id)}
              >
                {a.icon} {a.name}
              </Chip>
            ))}
          </div>
          {validationErrors.activityId && <p className="mt-1 text-xs text-red-500">{validationErrors.activityId}</p>}
        </div>

        <Field label="Titre" error={validationErrors.title}>
          <input
            type="text"
            required
            minLength={3}
            maxLength={100}
            value={form.title}
            onChange={update('title')}
            placeholder="Ex: Footing matinal au parc"
            className={inputClass(!!validationErrors.title)}
          />
        </Field>

        <Field label="Description">
          <textarea
            maxLength={1000}
            value={form.description}
            onChange={update('description')}
            rows={3}
            placeholder="Décrivez votre événement..."
            className={inputClass(false, 'resize-none')}
          />
        </Field>

        <Field label="Photo de couverture" hint="Optionnel — illustre la carte de l'événement.">
          <PhotoInput value={form.photoUrl} onChange={(url) => set('photoUrl', url)} />
        </Field>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-mid">Ville</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {cities.slice(0, 8).map((c) => (
              <Chip key={c} active={form.city === c} onClick={() => set('city', c)}>
                {c}
              </Chip>
            ))}
          </div>
          <CityPicker
            value={form.city}
            error={!!validationErrors.city}
            placeholder="Ou cherchez votre commune…"
            onChange={(c) => {
              set('city', c.name);
              if (c.lat != null && c.lng != null && form.latitude == null) {
                setForm((prev) => ({ ...prev, latitude: c.lat, longitude: c.lng }));
              }
            }}
          />
          {validationErrors.city && <p className="mt-1 text-xs text-red-500">{validationErrors.city}</p>}
        </div>

        <Field label="Lieu / Point de RDV">
          <input
            type="text"
            value={form.location}
            onChange={update('location')}
            placeholder="Ex: Entrée du parc"
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

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-mid">Récurrence</label>
          <div className="flex flex-wrap items-center gap-2">
            <Chip active={form.recurrenceWeeks === 0} onClick={() => set('recurrenceWeeks', 0)}>
              Une seule fois
            </Chip>
            {[2, 4, 8, 12].map((w) => (
              <Chip key={w} active={form.recurrenceWeeks === w} onClick={() => set('recurrenceWeeks', w)}>
                🔁 {w} semaines
              </Chip>
            ))}
          </div>
          {form.recurrenceWeeks >= 2 && (
            <p className="mt-1 text-xs text-ink-sub">
              {form.recurrenceWeeks} événements seront créés, un par semaine à la même heure.
            </p>
          )}
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Création...' : "Créer l'événement 🎉"}
        </Button>
      </form>
    </div>
  );
}
