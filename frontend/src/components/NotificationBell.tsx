import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listNotifications, markAllNotificationsRead, type NotificationItem } from '../api/notifications';

const TYPE_ICONS: Record<string, string> = {
  participant_joined: '🎉',
  participant_left: '👋',
  event_cancelled: '🚫',
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await listNotifications();
        if (!cancelled) {
          setItems(data.items);
          setUnread(data.unreadCount);
        }
      } catch {
        // silent — the bell just stays empty
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      markAllNotificationsRead().catch(() => {});
      setUnread(0);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors hover:bg-cream-deep"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[1250] mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-card-hover">
          <p className="border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-sub">
            Notifications
          </p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-sub">Aucune notification.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      if (n.eventId) navigate(`/events/${n.eventId}`);
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cream ${
                      n.isRead ? '' : 'bg-coral-50/50'
                    }`}
                  >
                    <span className="text-lg">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink">{n.message}</span>
                      <span className="block text-xs text-ink-sub">
                        {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
