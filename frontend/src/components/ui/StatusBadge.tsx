const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  Published: { label: 'Publié', className: 'bg-emerald-50 text-emerald-700' },
  Completed: { label: 'Terminé', className: 'bg-cream-deep text-ink-mid' },
  Cancelled: { label: 'Annulé', className: 'bg-red-50 text-red-600' },
  Draft: { label: 'Brouillon', className: 'bg-amber-50 text-amber-700' },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: 'bg-cream-deep text-ink-mid' };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>
  );
}
