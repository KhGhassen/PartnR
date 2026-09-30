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
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-[15px] font-bold transition-colors whitespace-nowrap ${
        active
          ? 'border-primary bg-primary text-on-primary'
          : 'border-border bg-surface text-text-2 hover:border-primary hover:text-primary-strong'
      } ${className}`}
    >
      {children}
    </button>
  );
}
