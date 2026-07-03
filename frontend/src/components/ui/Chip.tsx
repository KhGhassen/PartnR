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
      className={`rounded-full border-[1.5px] px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-1 ${
        active
          ? 'border-coral-500 bg-coral-500 text-white'
          : 'border-line bg-white text-ink-mid hover:border-coral-300 hover:text-ink'
      } ${className}`}
    >
      {children}
    </button>
  );
}
