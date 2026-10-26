import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'max-w-2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full ${maxWidth} overflow-hidden transform transition-all animate-slide-down`}
      >
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-linear-to-r from-slate-50 via-white to-slate-50/50">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-500 font-normal mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 rounded-lg p-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[85vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
