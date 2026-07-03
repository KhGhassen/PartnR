const PALETTE = [
  { bg: 'bg-coral-50', text: 'text-coral-700' },
  { bg: 'bg-violet-50', text: 'text-violet-700' },
  { bg: 'bg-amber-50', text: 'text-amber-700' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700' },
];

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-2xl',
};

interface AvatarProps {
  name: string;
  url?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

export default function Avatar({ name, url, size = 'md', className = '' }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover bg-cream-deep ${className}`}
      />
    );
  }
  const color = PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length];
  return (
    <div
      className={`${sizes[size]} ${color.bg} ${color.text} flex shrink-0 items-center justify-center rounded-full font-bold ${className}`}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  );
}
