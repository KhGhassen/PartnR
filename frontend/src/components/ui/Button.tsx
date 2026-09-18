import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'soft' | 'ghost' | 'danger' | 'violet';
type Size = 'sm' | 'md' | 'lg';

// Buttons are 10px-radius rectangles; chips stay pills. With 53 rounded-full
// classes in the app a filter chip and a primary action were the same object —
// the shape contrast is what separates "action" from "filter".
const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

// text-on-accent, never a literal white: on the light theme the accent carries
// white, on the dark theme it carries ink. White on a light accent is 2.8:1 —
// the mistake most dark modes ship.
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-strong shadow-card',
  violet: 'bg-violet text-on-accent hover:opacity-90 shadow-card',
  soft: 'bg-accent-surface text-accent-strong hover:brightness-95 border border-accent-surface',
  ghost: 'bg-surface text-text-2 border border-border-strong hover:text-text',
  danger: 'bg-danger-surface text-danger border border-danger-surface hover:brightness-95',
};

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3.5 py-1.5',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3',
};

function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

interface ButtonLinkProps {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ to, variant = 'primary', size = 'md', className = '', children }: ButtonLinkProps) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
