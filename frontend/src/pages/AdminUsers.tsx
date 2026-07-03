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
      <h1 className="text-3xl font-bold mb-8">Gestion des utilisateurs</h1>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="flex-1 border-[1.5px] border-line rounded-2xl px-3 py-2"
        />
        <button
          type="submit"
          className="bg-coral-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-coral-600"
        >
          Rechercher
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading ? (
          <p className="text-center py-8 text-gray-500">Chargement...</p>
        ) : users.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Aucun utilisateur trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
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
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-medium">{u.firstName}</td>
                  <td className="py-3 text-gray-500">{u.email}</td>
                  <td className="py-3 text-gray-500">{u.city}</td>
                  <td className="py-3 text-gray-500">{u.role}</td>
                  <td className="py-3">
                    {u.isBanned ? (
                      <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                        Banni
                      </span>
                    ) : (
                      <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                        Actif
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {u.role === 'admin' ? (
                      <span className="text-gray-300 text-xs">—</span>
                    ) : (
                      <button
                        onClick={() => toggleBan(u)}
                        disabled={updatingId === u.id}
                        className={`text-sm font-medium hover:underline disabled:opacity-50 ${
                          u.isBanned ? 'text-green-600' : 'text-red-600'
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
