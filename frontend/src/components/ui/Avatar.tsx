const PALETTE = [
  'bg-primary-surface text-primary-strong',
  'bg-violet-surface text-violet-strong',
  'bg-sun-surface text-sun-strong',
  'bg-success-surface text-success-strong',
  'bg-cat-games text-cat-games-text',
  'bg-cat-walk text-cat-walk-text',
];

const sizes = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-11 w-11 text-base',
  lg: 'h-20 w-20 text-3xl',
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
        className={`${sizes[size]} rounded-full object-cover bg-surface-sunken ${className}`}
      />
    );
  }
  const color = PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length];
  return (
    <div
      className={`${sizes[size]} ${color} flex shrink-0 items-center justify-center rounded-full font-extrabold ${className}`}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  );
}
