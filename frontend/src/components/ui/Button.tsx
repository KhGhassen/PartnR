import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'sun' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'violet';
type Size = 'sm' | 'md' | 'lg';

// Pills, bold, never under 44 px tall: a button has to look like a button to
// someone who does not use the web every day, and be easy to hit with a
// finger or a shaky hand.
const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap active:scale-[0.98]';

// on-primary, never a literal white: the light theme carries white on the
// primary, the dark theme carries ink on a light primary.
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover shadow-card',
  sun: 'bg-sun text-on-sun hover:brightness-95 shadow-card',
  secondary: 'bg-primary-surface text-primary-strong hover:brightness-95',
  soft: 'bg-primary-surface text-primary-strong hover:brightness-95',
  ghost: 'bg-surface text-text border-2 border-border hover:border-border-strong hover:bg-surface-sunken',
  danger: 'bg-danger-surface text-danger-strong border-2 border-danger-surface hover:brightness-95',
  violet: 'bg-violet text-white hover:opacity-90 shadow-card',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-11 px-5 text-[15px]',
  md: 'min-h-12 px-6 text-base',
  lg: 'min-h-14 px-8 text-lg',
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
