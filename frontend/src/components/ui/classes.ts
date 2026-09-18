// bandColor used to tint an event card from its INDEX IN THE LIST, so the same
// event changed colour between the home feed and "Mes événements" — a colour
// that meant nothing and lied about its own constancy. Cards now carry a neutral
// band with an activity medallion; this stays as a constant so the remaining
// call sites keep compiling while they are cleaned up.
export function bandColor() {
  return 'bg-surface-sunken';
}

export function inputClass(hasError = false, extra = '') {
  // border-strong, not border: an input outline carries meaning, so it owes
  // 3:1 against the surface. The old #E8E6E0 sat at 1.19 and signalled nothing.
  return `w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-3 outline-none transition-colors focus:border-accent ${
    hasError ? 'border-danger' : 'border-border-strong'
  } ${extra}`.trim();
}
