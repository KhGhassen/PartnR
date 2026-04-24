import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api/events';
import { listActivities } from '../api/activities';
import { useAuth } from '../context/AuthContext';
import { trackAction } from '../api/analytics';
import type { Activity } from '../types';

export default function CreateEvent() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
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
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    listActivities().then(setActivities).catch(() => {});
  }, [isAuthenticated, navigate]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setValidationErrors((prev) => ({ ...prev, [field]: '' }));
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
      });
      trackAction({ action: 'event_created', entityType: 'event', entityId: ev.id });
      navigate(`/events/${ev.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none ${
      validationErrors[field] ? 'border-red-400' : 'border-gray-300'
    }`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Créer un événement</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activité</label>
          <select
            required
            value={form.activityId}
            onChange={update('activityId')}
            className={inputClass('activityId')}
          >
            <option value="">Choisir une activité</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </select>
          {validationErrors.activityId && <p className="text-red-500 text-xs mt-1">{validationErrors.activityId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={100}
            value={form.title}
            onChange={update('title')}
            placeholder="Ex: Footing matinal au parc"
            className={inputClass('title')}
          />
          {validationErrors.title && <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            maxLength={1000}
            value={form.description}
            onChange={update('description')}
            rows={3}
            placeholder="Décrivez votre événement..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input
              type="text"
              required
              value={form.city}
              onChange={update('city')}
              className={inputClass('city')}
            />
            {validationErrors.city && <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu / Point de RDV</label>
            <input
              type="text"
              value={form.location}
              onChange={update('location')}
              placeholder="Ex: Entrée du parc"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure</label>
            <input
              type="datetime-local"
              required
              value={form.date}
              onChange={update('date')}
              className={inputClass('date')}
            />
            {validationErrors.date && <p className="text-red-500 text-xs mt-1">{validationErrors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max participants</label>
            <input
              type="number"
              required
              min={2}
              max={50}
              value={form.maxParticipants}
              onChange={update('maxParticipants')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer l\'événement'}
        </button>
      </form>
    </div>
  );
}
