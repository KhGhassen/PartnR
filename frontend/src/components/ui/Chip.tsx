import type { ReactNode } from 'react';

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

export default function Chip({ active = false, onClick, children, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? 'border-accent bg-accent text-on-accent'
          : 'border-border-strong bg-surface text-text-2 hover:border-accent hover:text-text'
      } ${className}`}
    >
      {children}
    </button>
  );
}
