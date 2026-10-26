import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useDossier } from '../context/DossierContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { ExamSession } from '../types';

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
  activeSessionId: number | null;
  setActiveSessionId: (id: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
  activeSessionId,
  setActiveSessionId,
  onRefresh,
  isRefreshing,
}) => {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    api.get<ExamSession[]>('/sessions')
      .then((data) => {
        setSessions(data);
        if (!activeSessionId && data.length > 0) {
          const active = data.find((s) => s.is_active) || data[0];
          setActiveSessionId(active.id);
        }
      })
      .catch(() => {});
  }, []);

  const tabTitles: Record<string, string> = {
    dashboard: 'Overview Dashboard',
    students: 'Student Registry & Cohort Directory',
    automation: 'Result Automation Center',
    results: 'Dynamic Result Analysis Matrix',
    pdfs: 'Marksheet PDF Management',
    reports: 'Enterprise Excel Reports',
    audit: 'Processing History & Audit Trail',
    settings: 'Staff & Security Settings',
  };

  const { openSearch } = useDossier();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onSignOut={() => setShowLogoutModal(true)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          currentTabName={tabTitles[currentTab] || 'Controller Portal'}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onOpenSearch={openSearch}
          onRequestSignOut={() => setShowLogoutModal(true)}
        />
        <main className="flex-1 overflow-y-auto pt-6 pb-14 bg-slate-50/70">
          {children}
        </main>
      </div>

      {/* Collegiate Sign Out Confirmation Dialog */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-backdrop-fade"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-sm overflow-hidden p-6 text-center animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Centered Crimson Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto shadow-inner mb-4">
              <LogOut className="w-6 h-6" />
            </div>

            {/* Centered Heading & Prompt */}
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-heading">
              Confirm Sign Out
            </h3>
            <p className="text-sm font-medium text-slate-700 leading-relaxed mt-2 px-2">
              Are you sure you want to end your active examination session? Any unsaved edits will be discarded.
            </p>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-mono text-slate-800 font-bold mt-3 shadow-2xs">
              Office of the Controller • Secure Session
            </div>

            {/* Balanced 50/50 Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                id="cancel-signout-btn"
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Stay Logged In
              </button>
              <button
                id="confirm-signout-btn"
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
