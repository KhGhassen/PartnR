// Form controls: tall, rounded, with an outline that reaches 3:1 against the
// white card they sit on. A field must be findable before it is read.
export function inputClass(hasError = false, extra = '') {
  return `w-full rounded-2xl border-2 bg-surface px-4 py-3 text-base text-text placeholder:text-text-3 outline-none transition-colors focus:border-primary ${
    hasError ? 'border-danger' : 'border-border-input'
  } ${extra}`.trim();
}
