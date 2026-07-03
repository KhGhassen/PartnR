import type { ReactNode } from 'react';

interface EmptyStateProps {
  emoji: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}

export default function EmptyState({ emoji, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-deep text-3xl">
        {emoji}
      </div>
      <p className="mt-2 font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-sub">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
