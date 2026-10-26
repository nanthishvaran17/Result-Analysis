import React from 'react';
import { LogOut, RefreshCw, Shield, Search, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CustomDropdown } from './CustomDropdown';
import type { ExamSession } from '../types';

interface TopbarProps {
  currentTabName: string;
  sessions: ExamSession[];
  activeSessionId: number | null;
  onSelectSession: (id: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenSearch?: () => void;
  onRequestSignOut?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTabName,
  sessions,
  activeSessionId,
  onSelectSession,
  onRefresh,
  isRefreshing,
  onOpenSearch,
  onRequestSignOut,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-8 flex items-center justify-between shadow-2xs sticky top-0 z-20">
      {/* Clean Breadcrumb Hierarchy */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          COE Portal
        </span>
        <span className="text-slate-300 font-bold">/</span>
        <h1 className="text-sm font-extrabold text-slate-900 tracking-tight font-heading">
          {currentTabName}
        </h1>
      </div>

      {/* Right Controls with Balanced Breathing Room */}
      <div className="flex items-center gap-3.5">
        {/* Global Spotlight Search Trigger */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-500">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Examination Session Selector */}
        <div className="w-56">
          <CustomDropdown
            value={activeSessionId || ''}
            onChange={(val) => onSelectSession(Number(val))}
            options={sessions.map((s) => ({
              value: s.id,
              label: s.session_code,
              badge: s.is_active ? 'Active' : undefined,
              sublabel: s.session_name || undefined,
            }))}
            size="sm"
            icon={Calendar}
            placeholder="Select Session"
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data"
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Role Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold border border-slate-800 shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>{user?.role || 'EXAM_STAFF'}</span>
        </div>

        {/* Sign Out Button */}
        <button
          id="topbar-signout-btn"
          onClick={onRequestSignOut || logout}
          className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Sign out of portal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
