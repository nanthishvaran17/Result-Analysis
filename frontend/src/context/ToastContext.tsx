import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, message, title, type };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string) => showToast(msg, 'success', title || 'Success'), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast(msg, 'error', title || 'Action Alert'), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast(msg, 'info', title || 'Notification'), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast(msg, 'warning', title || 'Warning'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((t) => {
          const typeStyles = {
            success: 'bg-slate-900/95 border-emerald-500/40 text-emerald-400 shadow-emerald-950/40',
            error: 'bg-slate-900/95 border-rose-500/40 text-rose-400 shadow-rose-950/40',
            warning: 'bg-slate-900/95 border-amber-500/40 text-amber-400 shadow-amber-950/40',
            info: 'bg-slate-900/95 border-blue-500/40 text-blue-400 shadow-blue-950/40',
          }[t.type];

          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-xl shadow-xl flex items-start gap-3 animate-slide-up transition-all ${typeStyles}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {t.title && <div className="text-xs font-bold text-white mb-0.5">{t.title}</div>}
                <div className="text-xs font-medium text-slate-300 leading-relaxed">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
