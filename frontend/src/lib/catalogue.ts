import type { Activity } from '../types';

// Display order is a product decision, not alphabetical: sport first because
// that is where the existing events live, then the evening/weekend outings that
// give the app a weekly rhythm.
export const CATEGORY_ORDER = ['Sport', 'Boire & manger', 'Culture', 'Balades', 'Jeux', 'Engagement'] as const;

export const CATEGORY_ICON: Record<string, string> = {
  Sport: '🏃',
  'Boire & manger': '🍽️',
  Culture: '🎭',
  Balades: '🚶',
  Jeux: '🎲',
  Engagement: '🤝',
};

export interface CategoryGroup {
  category: string;
  icon: string;
  activities: Activity[];
}

/** Groups activities by category in display order; unknown categories go last. */
export function groupByCategory(activities: Activity[]): CategoryGroup[] {
  const byCategory = new Map<string, Activity[]>();
  for (const a of activities) {
    const key = a.category || 'Autres';
    const list = byCategory.get(key) ?? [];
    list.push(a);
    byCategory.set(key, list);
  }

  const known = CATEGORY_ORDER.filter((c) => byCategory.has(c));
  const unknown = [...byCategory.keys()].filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)).sort();

  return [...known, ...unknown].map((category) => ({
    category,
    icon: CATEGORY_ICON[category] ?? '✨',
    activities: byCategory.get(category)!,
  }));
}
