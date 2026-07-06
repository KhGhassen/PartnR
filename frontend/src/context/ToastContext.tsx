import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  leaving?: boolean;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>(null!);

const KIND_STYLES: Record<ToastKind, { icon: string; accent: string }> = {
  success: { icon: '✓', accent: 'bg-emerald-500' },
  error: { icon: '✕', accent: 'bg-red-500' },
  info: { icon: 'ℹ', accent: 'bg-violet-500' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 200);
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((ts) => [...ts.slice(-2), { id, kind, message }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  const api = {
    success: useCallback((m: string) => push('success', m), [push]),
    error: useCallback((m: string) => push('error', m), [push]),
    info: useCallback((m: string) => push('info', m), [push]),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[1300] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-card-hover transition-all duration-200 ${
              t.leaving ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${KIND_STYLES[t.kind].accent}`}
            >
              {KIND_STYLES[t.kind].icon}
            </span>
            <p className="text-sm font-medium text-ink">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
