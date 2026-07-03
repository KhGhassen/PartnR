import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export default function Field({ label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink-mid">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-ink-sub">{hint}</p>}
    </div>
  );
}
