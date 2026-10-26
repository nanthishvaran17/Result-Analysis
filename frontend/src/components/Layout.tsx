import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          currentTabName={tabTitles[currentTab] || 'Controller Portal'}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
