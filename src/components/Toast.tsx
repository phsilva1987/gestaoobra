import { useEffect } from 'react';

export interface ToastMsg {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMsg[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => onDismiss(t.id), t.type === 'error' ? 7000 : 2800)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  if (!toasts.length) return null;

  return (
    <div id="toastWrap" style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {toasts.map((t) => {
        const icon = t.type === 'success' ? '✓' : t.type === 'error' ? '⚠' : 'ℹ';
        return (
          <div
            key={t.id}
            className={`toast ${t.type}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 10,
              background: t.type === 'error' ? '#d94a3a' : t.type === 'success' ? '#2d9e5f' : '#3a6db8',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 6px 18px rgba(0,0,0,.18)',
              maxWidth: 360,
            }}
          >
            <span>{icon}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 16, padding: 0, lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
