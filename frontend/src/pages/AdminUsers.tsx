import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listUsers, banUser, unbanUser } from '../api/admin';
import { toApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { AdminUser } from '../types';

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const load = (term: string) => {
    setLoading(true);
    setError('');
    listUsers({ search: term || undefined, pageSize: 50 })
      .then((res) => setUsers(res.items))
      .catch((err) => setError(toApiError(err).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') load('');
  }, [isAuthenticated, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    load(search);
  };

  const toggleBan = async (target: AdminUser) => {
    setUpdatingId(target.id);
    setError('');
    try {
      const updated = target.isBanned ? await unbanUser(target.id) : await banUser(target.id);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-text mb-8">Gestion des utilisateurs</h1>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="flex-1 rounded-2xl border-2 border-border-input px-4 py-3 text-base outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-bold text-on-primary hover:bg-primary-hover"
        >
          Rechercher
        </button>
      </form>

      {error && <p className="text-danger-strong text-sm mb-4">{error}</p>}

      <div className="bg-surface rounded-3xl ring-1 ring-border p-6 shadow-card">
        {loading ? (
          <p className="text-center py-8 text-text-3">Chargement...</p>
        ) : users.length === 0 ? (
          <p className="text-center py-8 text-text-3">Aucun utilisateur trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-3 border-b border-border text-sm uppercase tracking-wide">
                <th className="pb-2 font-medium">Nom</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Ville</th>
                <th className="pb-2 font-medium">Rôle</th>
                <th className="pb-2 font-medium">Statut</th>
                <th className="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-sunken transition-colors">
                  <td className="py-3 font-medium">{u.firstName}</td>
                  <td className="py-3 text-text-2">{u.email}</td>
                  <td className="py-3 text-text-2">{u.city}</td>
                  <td className="py-3 text-text-2">{u.role}</td>
                  <td className="py-3">
                    {u.isBanned ? (
                      <span className="bg-danger-surface text-danger-strong px-2 py-1 rounded-full text-sm font-medium">
                        Banni
                      </span>
                    ) : (
                      <span className="bg-success-surface text-success-strong px-2 py-1 rounded-full text-sm font-medium">
                        Actif
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {u.role === 'admin' ? (
                      <span className="text-text-3 text-sm">—</span>
                    ) : (
                      <button
                        onClick={() => toggleBan(u)}
                        disabled={updatingId === u.id}
                        className={`text-sm font-medium hover:underline disabled:opacity-50 ${
                          u.isBanned ? 'text-success-strong' : 'text-danger-strong'
                        }`}
                      >
                        {updatingId === u.id ? '...' : u.isBanned ? 'Débannir' : 'Bannir'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
