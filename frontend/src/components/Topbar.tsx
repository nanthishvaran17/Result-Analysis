import React from 'react';
import { LogOut, RefreshCw, Shield, FileSpreadsheet, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { ExamSession } from '../types';

interface TopbarProps {
  currentTabName: string;
  sessions: ExamSession[];
  activeSessionId: number | null;
  onSelectSession: (id: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenSearch?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTabName,
  sessions,
  activeSessionId,
  onSelectSession,
  onRefresh,
  isRefreshing,
  onOpenSearch,
}) => {
  const { user, logout } = useAuth();
  const { success } = useToast();

  const handleDownloadTemplate = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/students/template', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to download template');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Student_Roster_Template.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        success('Student Roster Excel Template downloaded successfully!');
      })
      .catch((err) => alert(err.message));
  };

  const activeSessionObj = sessions.find((s) => s.id === activeSessionId);

  return (
    <header className="h-17 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 flex items-center justify-between shadow-2xs sticky top-0 z-20">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight font-heading">
              {currentTabName}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              Controller Office
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Active Session: <span className="font-semibold text-slate-700">{activeSessionObj?.session_name || 'Select Examination Session'}</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Global Spotlight Search Trigger */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-500">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Quick Download Excel Template */}
        <button
          onClick={handleDownloadTemplate}
          title="Download Official Student Roster Excel Template (.xlsx)"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-sm transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Excel Template</span>
        </button>

        {/* Examination Session Selector */}
        <div className="flex items-center gap-2 bg-slate-50/90 border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-500 font-medium hidden sm:inline">Session:</span>
          <select
            className="bg-transparent text-slate-800 font-bold focus:outline-hidden cursor-pointer"
            value={activeSessionId || ''}
            onChange={(e) => onSelectSession(Number(e.target.value))}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.session_code} {s.is_active ? '● Current' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data"
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200/60 shadow-2xs active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Role Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold border border-slate-800 shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>{user?.role || 'EXAM_STAFF'}</span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50/60 hover:bg-rose-100/70 px-3 py-1.5 rounded-xl border border-rose-200/70 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
