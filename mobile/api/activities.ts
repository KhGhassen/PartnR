import client from './client';

export type Activity = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  category: string;
};

// Display order is a product decision: sport first (where the events are),
// then the evening/weekend outings that give the app a weekly rhythm.
export const CATEGORY_ORDER = ['Sport', 'Boire & manger', 'Culture', 'Balades', 'Jeux', 'Engagement'];

export const CATEGORY_ICON: Record<string, string> = {
  Sport: '🏃', 'Boire & manger': '🍽️', Culture: '🎭', Balades: '🚶', Jeux: '🎲', Engagement: '🤝',
};

export function groupByCategory(activities: Activity[]): { category: string; icon: string; activities: Activity[] }[] {
  const by = new Map<string, Activity[]>();
  for (const a of activities) {
    const k = a.category || 'Autres';
    by.set(k, [...(by.get(k) ?? []), a]);
  }
  const known = CATEGORY_ORDER.filter((c) => by.has(c));
  const unknown = [...by.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort();
  return [...known, ...unknown].map((category) => ({
    category,
    icon: CATEGORY_ICON[category] ?? '✨',
    activities: by.get(category)!,
  }));
}

export const listActivities = () =>
  client.get<Activity[]>('/activities').then((r) => r.data);
