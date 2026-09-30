import type { ReactNode } from 'react';

interface EmptyStateProps {
  emoji: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}

export default function EmptyState({ emoji, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface px-6 py-16 text-center shadow-card">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-surface text-4xl">
        {emoji}
      </div>
      <p className="mt-3 text-xl font-extrabold text-text">{title}</p>
      {hint && <p className="max-w-md text-base text-text-2">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
