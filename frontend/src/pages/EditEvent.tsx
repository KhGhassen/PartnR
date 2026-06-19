import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, updateEvent } from '../api/events';
import { useAuth } from '../context/AuthContext';

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    city: '',
    location: '',
    date: '',
    maxParticipants: 5,
    status: 'Published',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

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
      });
    }).catch(() => {
      setError('Événement introuvable.');
    }).finally(() => {
      setPageLoading(false);
    });
  }, [id, isAuthenticated, user, navigate]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setValidationErrors((prev) => ({ ...prev, [field]: '' }));
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
      });
      navigate(`/events/${id}`);
    } catch (err) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <p className="text-center py-12 text-gray-500">Chargement...</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Modifier l'événement</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={100}
            value={form.title}
            onChange={update('title')}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none ${
              validationErrors.title ? 'border-red-400' : 'border-gray-300'
            }`}
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
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none ${
                validationErrors.city ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {validationErrors.city && <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu / Point de RDV</label>
            <input
              type="text"
              value={form.location}
              onChange={update('location')}
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
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none ${
                validationErrors.date ? 'border-red-400' : 'border-gray-300'
              }`}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            value={form.status}
            onChange={update('status')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="Published">Publié</option>
            <option value="Cancelled">Annulé</option>
            <option value="Completed">Terminé</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/events/${id}`)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
