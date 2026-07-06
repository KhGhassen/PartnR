import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getDashboard } from '../api/analytics';
import { useAuth } from '../context/AuthContext';
import type { AnalyticsDashboard } from '../types';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function AnalyticsDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
      return;
    }
    getDashboard()
      .then(setData)
      .catch(() => setError('Impossible de charger le tableau de bord.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, navigate]);

  if (loading) return <p className="text-center py-12 text-ink-sub">Chargement...</p>;
  if (error) return <p className="text-center py-12 text-red-500">{error}</p>;
  if (!data) return null;

  const dayLabels = data.actionsByDay.map((d) =>
    new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  );
  const dayData = data.actionsByDay.map((d, i) => ({ name: dayLabels[i], count: d.count }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-ink mb-8">Analytics</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {[
          { label: 'Utilisateurs', value: data.totalUsers },
          { label: 'Événements', value: data.totalEvents },
          { label: 'Actions totales', value: data.totalActions },
          { label: "Actions aujourd'hui", value: data.todayActions },
          { label: 'Nouveaux (7j)', value: data.newUsersLast7Days },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-3xl border border-line p-5 text-center shadow-card">
            <p className="text-3xl font-bold text-coral-500">{kpi.value}</p>
            <p className="text-sm text-ink-sub mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Actions per day (last 7 days) */}
        <div className="bg-white rounded-3xl border border-line p-6 shadow-card">
          <h2 className="text-lg font-bold text-ink mb-4">Actions (7 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dayData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Actions by type (last 30 days) */}
        <div className="bg-white rounded-3xl border border-line p-6 shadow-card">
          <h2 className="text-lg font-bold text-ink mb-4">Types d'actions (30j)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.actionsByType}
                dataKey="count"
                nameKey="action"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.actionsByType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top events */}
      <div className="bg-white rounded-3xl border border-line p-6 shadow-card">
        <h2 className="text-lg font-bold text-ink mb-4">Top 5 événements</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-sub border-b border-line text-xs uppercase tracking-wide">
              <th className="pb-2 font-medium">Titre</th>
              <th className="pb-2 font-medium">Ville</th>
              <th className="pb-2 font-medium text-right">Participants</th>
            </tr>
          </thead>
          <tbody>
            {data.topEvents.map((ev) => (
              <tr key={ev.id} className="border-b border-cream-deep last:border-0 hover:bg-cream transition-colors">
                <td className="py-2 font-medium">{ev.title}</td>
                <td className="py-2 text-ink-mid">{ev.city}</td>
                <td className="py-2 text-right text-coral-500 font-bold">{ev.participantCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
