import React from 'react';
import { LogOut, RefreshCw, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { ExamSession } from '../types';

interface TopbarProps {
  currentTabName: string;
  sessions: ExamSession[];
  activeSessionId: number | null;
  onSelectSession: (id: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTabName,
  sessions,
  activeSessionId,
  onSelectSession,
  onRefresh,
  isRefreshing,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-20">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">{currentTabName}</h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Examination Session Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
          <span className="text-slate-500 font-medium">Session:</span>
          <select
            className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
            value={activeSessionId || ''}
            onChange={(e) => onSelectSession(Number(e.target.value))}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.session_code} {s.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data"
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Role Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60">
          <Shield className="w-3.5 h-3.5" />
          <span>{user?.role}</span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200/60 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
