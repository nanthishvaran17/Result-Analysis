import React, { useState, useEffect } from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Modal } from './Modal';
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

      {/* Collegiate Sign Out Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Sign Out"
        subtitle="Office of the Controller of Examinations"
        icon={<LogOut className="w-5 h-5 text-rose-600" />}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 mb-0.5">Are you sure you want to sign out?</p>
              <p className="text-amber-800 leading-relaxed">
                Ending your active session will secure the examination database. Any unsaved edits will be discarded.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              id="cancel-signout-btn"
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-signout-btn"
              type="button"
              onClick={() => {
                setShowLogoutModal(false);
                logout();
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
