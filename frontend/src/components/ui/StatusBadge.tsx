const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  Published: { label: 'Ouvert', className: 'bg-success-surface text-success-strong' },
  Completed: { label: 'Terminé', className: 'bg-surface-sunken text-text-2' },
  Cancelled: { label: 'Annulé', className: 'bg-danger-surface text-danger-strong' },
  Draft: { label: 'Brouillon', className: 'bg-warn-surface text-warn-strong' },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: 'bg-surface-sunken text-text-2' };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${s.className}`}>{s.label}</span>
  );
}
