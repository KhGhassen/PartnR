import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api/events';
import { listActivities } from '../api/activities';
import { listCities } from '../api/cities';
import { toApiError } from '../api/client';
import { fromLocalInputValue } from '../lib/datetime';
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
import { categoryTone, groupByCategory } from '../lib/catalogue';
import type { Activity } from '../types';

// Three numbered cards: what, then the words, then where and when. Someone
// who has never filled a web form knows where they are and what is left.
function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-surface p-5 shadow-card ring-1 ring-border sm:p-7">
      <h2 className="mb-5 flex items-center gap-3 text-xl font-extrabold text-text">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-base text-on-primary" aria-hidden="true">
          {n}
        </span>
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

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
    if (form.title.trim().length < 3) errors.title = "Donnez un titre d'au moins 3 caractères.";
    if (!form.city.trim()) errors.city = 'Indiquez la ville.';
    if (!form.date) errors.date = "Indiquez la date et l'heure.";
    else if (new Date(form.date) < new Date()) errors.date = 'La date doit être dans le futur.';
    if (!form.activityId) errors.activityId = 'Choisissez une activité.';
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
        date: fromLocalInputValue(form.date),
        maxParticipants: Number(form.maxParticipants),
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        recurrenceWeeks: form.recurrenceWeeks >= 2 ? form.recurrenceWeeks : undefined,
      });
      trackAction({ action: 'event_created', entityType: 'event', entityId: ev.id });
      toast.success('Votre sortie est en ligne 🎉');
      navigate(`/events/${ev.id}`);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <h1 className="text-3xl font-extrabold text-text">Proposer une sortie</h1>
      <p className="mb-6 mt-1 text-base text-text-2">Trois étapes, et vous pourrez tout modifier ensuite.</p>

      {error && (
        <div className="mb-4 rounded-2xl bg-danger-surface px-5 py-3 font-semibold text-danger-strong">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Step n={1} title="Quelle activité ?">
          <div className="space-y-4">
            {groupByCategory(activities).map((g) => {
              const tone = categoryTone(g.category);
              return (
                <div key={g.category}>
                  <p className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${tone.bg} ${tone.text}`}>
                    <span aria-hidden="true">{g.icon}</span> {g.category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {g.activities.map((a) => (
                      <Chip key={a.id} active={form.activityId === a.id} onClick={() => set('activityId', a.id)}>
                        <span aria-hidden="true">{a.icon}</span> {a.name}
                      </Chip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {validationErrors.activityId && (
            <p className="text-sm font-semibold text-danger-strong">{validationErrors.activityId}</p>
          )}
        </Step>

        <Step n={2} title="Décrivez la sortie">
          <Field label="Titre" error={validationErrors.title}>
            <input
              type="text"
              required
              minLength={3}
              maxLength={100}
              value={form.title}
              onChange={update('title')}
              placeholder="Ex. : Footing tranquille au parc"
              className={inputClass(!!validationErrors.title)}
            />
          </Field>

          <Field label="Quelques mots" hint="Le rythme, le niveau, ce qu'il faut apporter… Tout ce qui rassure avant de venir.">
            <textarea
              maxLength={1000}
              value={form.description}
              onChange={update('description')}
              rows={4}
              placeholder="Ex. : On court 5 km à allure douce, tous niveaux bienvenus. On finit par un café."
              className={inputClass(false, 'resize-none')}
            />
          </Field>

          <Field label="Photo" hint="Facultatif. Elle illustre la carte de la sortie.">
            <PhotoInput value={form.photoUrl} onChange={(url) => set('photoUrl', url)} />
          </Field>
        </Step>

        <Step n={3} title="Où et quand ?">
          <div>
            <p className="mb-2 block text-[15px] font-bold text-text">Ville</p>
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
            {validationErrors.city && <p className="mt-1.5 text-sm font-semibold text-danger-strong">{validationErrors.city}</p>}
          </div>

          <Field label="Point de rendez-vous" hint="Visible seulement par les participants.">
            <input
              type="text"
              value={form.location}
              onChange={update('location')}
              placeholder="Ex. : Entrée du parc, côté fontaine"
              className={inputClass(false)}
            />
          </Field>

          <Field label="Sur la carte">
            <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={updateLocation} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date et heure" error={validationErrors.date}>
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={update('date')}
                className={inputClass(!!validationErrors.date)}
              />
            </Field>
            <Field label="Nombre de places" hint="Vous compris, de 2 à 50.">
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
            <p className="mb-2 block text-[15px] font-bold text-text">Ça revient ?</p>
            <div className="flex flex-wrap items-center gap-2">
              <Chip active={form.recurrenceWeeks === 0} onClick={() => set('recurrenceWeeks', 0)}>
                Une seule fois
              </Chip>
              {[2, 4, 8, 12].map((w) => (
                <Chip key={w} active={form.recurrenceWeeks === w} onClick={() => set('recurrenceWeeks', w)}>
                  Chaque semaine, {w} fois
                </Chip>
              ))}
            </div>
            {form.recurrenceWeeks >= 2 && (
              <p className="mt-2 text-[15px] text-text-2">
                {form.recurrenceWeeks} dates seront créées, une par semaine à la même heure.
              </p>
            )}
          </div>
        </Step>

        <Button type="submit" variant="sun" size="lg" disabled={loading} className="w-full">
          {loading ? 'Publication…' : 'Publier ma sortie'}
        </Button>
      </form>
    </div>
  );
}
