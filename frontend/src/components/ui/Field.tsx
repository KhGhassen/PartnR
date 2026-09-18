import { Children, cloneElement, isValidElement, useId, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

// The label used to render without htmlFor, with the control emitted after it
// closed — no association at all, on every field in the app. A screen reader
// announced "edit, blank" across the whole sign-up funnel (WCAG 1.3.1 / 3.3.1
// / 3.3.2, level A, on the product's front door).
//
// The id is injected by cloning the child rather than exposed through a
// render-prop API, so all 24 existing call sites keep working unchanged.
export default function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const only = Children.count(children) === 1 ? Children.only(children) : null;
  const control =
    only && isValidElement(only)
      ? cloneElement(only as React.ReactElement<Record<string, unknown>>, {
          id,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy,
        })
      : children;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-text-2">
        {label}
      </label>
      {control}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="mt-1 text-xs text-text-3">
          {hint}
        </p>
      )}
    </div>
  );
}
