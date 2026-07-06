const BAND_COLORS = ['bg-coral-50', 'bg-violet-50', 'bg-amber-50', 'bg-emerald-50'];

export function bandColor(i: number) {
  return BAND_COLORS[i % BAND_COLORS.length];
}

export function inputClass(hasError = false, extra = '') {
  return `w-full rounded-2xl border-[1.5px] bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-sub outline-none transition-colors focus:border-coral-500 focus:ring-2 focus:ring-coral-500/20 ${
    hasError ? 'border-red-400' : 'border-line'
  } ${extra}`.trim();
}
