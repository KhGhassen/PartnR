// « Grand Air » — the same values as frontend/src/index.css, where every
// pair was contrast-checked against WCAG 2.1 AA. One blue for every action,
// a sunny yellow for the single most important button on a screen, a pastel
// per activity category. Historical names (coral, coralL, bg2) are kept so
// every screen picks the new palette up without edits.
export const T = {
  coral:    '#2563eb',  // primary — white on top: 5.17:1
  coralL:   '#e8f0fe',  // primary surface (tints, selected chips)
  coralD:   '#1d4ed8',  // primary as text on a tint or sunken surface
  sun:      '#ffb703',  // the one most important button; ink on top: 10.2:1
  sunL:     '#fff4d6',
  violet:   '#7c3aed',  // social: organiser, waitlist, recurrence
  violetL:  '#ede9fe',
  bg:       '#f4f7fb',
  bg2:      '#e9eff6',  // sunken surface
  card:     '#ffffff',
  text:     '#111827',
  textMid:  '#374151',
  textSub:  '#5b6472',  // 5.6:1 on bg
  border:   '#e2e8f0',
  success:  '#15803d',
  successL: '#dcfce7',
  danger:   '#dc2626',
  dangerL:  '#fee2e2',
  warn:     '#b45309',  // also scarcity: "plus que 2 places"
  warnL:    '#fef3c7',
  night:    '#0f172a',
} as const;

// One pastel per category, so a card is recognised before it is read.
export const CATEGORY_TONE: Record<string, { bg: string; text: string }> = {
  Sport: { bg: '#dcfce7', text: '#166534' },
  'Boire & manger': { bg: '#ffedd5', text: '#9a3412' },
  Culture: { bg: '#ede9fe', text: '#5b21b6' },
  Balades: { bg: '#ccfbf1', text: '#115e59' },
  Jeux: { bg: '#fce7f3', text: '#9d174d' },
  Engagement: { bg: '#fef3c7', text: '#92400e' },
};

export const categoryTone = (category?: string | null) =>
  (category && CATEGORY_TONE[category]) || { bg: T.bg2, text: T.textMid };
