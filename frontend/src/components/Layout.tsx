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
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop-fade"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-sm overflow-hidden p-6 text-center animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Centered Calm Icon Badge */}
            <div className="w-13 h-13 rounded-2xl bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-700 mx-auto shadow-inner mb-4">
              <LogOut className="w-5 h-5 text-slate-700" />
            </div>

            {/* Centered Heading & Prompt */}
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-heading">
              Sign Out of COE Portal
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-2 px-2">
              You are signing out of your secure examination staff session. Your records and ledger updates are permanently saved.
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[10px] font-mono text-slate-600 font-semibold mt-3">
              Office of the Controller • Secure Session
            </div>

            {/* Balanced 50/50 Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                id="cancel-signout-btn"
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200/90 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              >
                Stay Signed In
              </button>
              <button
                id="confirm-signout-btn"
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-300" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
