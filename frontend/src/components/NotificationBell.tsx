import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { listNotifications, markAllNotificationsRead, type NotificationItem } from '../api/notifications';

const TYPE_ICONS: Record<string, string> = {
  participant_joined: '🎉',
  participant_left: '👋',
  participant_waitlisted: '⏳',
  waitlist_promoted: '✅',
  event_cancelled: '🚫',
  event_rescheduled: '📅',
  event_reminder: '⏰',
  chat_message: '💬',
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
        aria-label={unread > 0 ? `Notifications, ${unread} non lue${unread > 1 ? 's' : ''}` : 'Notifications'}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-surface-sunken hover:text-text"
      >
        <Bell size={22} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[1250] mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-card-hover">
          <p className="border-b border-border px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-text-3">
            Notifications
          </p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-text-3">Aucune notification.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      if (n.eventId) navigate(`/events/${n.eventId}`);
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-sunken ${
                      n.isRead ? '' : 'bg-primary-surface/50'
                    }`}
                  >
                    <span className="text-lg">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-text">{n.message}</span>
                      <span className="block text-sm text-text-3">
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
