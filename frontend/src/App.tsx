import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { StudentRegistry } from './pages/StudentRegistry';
import { ResultAutomationCenter } from './pages/ResultAutomationCenter';
import { ResultAnalysis } from './pages/ResultAnalysis';
import { PdfManagement } from './pages/PdfManagement';
import { AdvancedExcelReports } from './pages/AdvancedExcelReports';
import { ProcessingHistoryAudit } from './pages/ProcessingHistoryAudit';
import { StaffSettings } from './pages/StaffSettings';
import { DossierProvider } from './context/DossierContext';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Initializing Examination System...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <DossierProvider onNavigateTab={setCurrentTab}>
      <Layout
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      >
        <div key={refreshKey}>
          {currentTab === 'dashboard' && <OverviewDashboard onNavigateTab={setCurrentTab} />}
          {currentTab === 'students' && <StudentRegistry />}
          {currentTab === 'automation' && <ResultAutomationCenter activeSessionId={activeSessionId} />}
          {currentTab === 'results' && (
            <ResultAnalysis activeSessionId={activeSessionId} onNavigateTab={setCurrentTab} />
          )}
          {currentTab === 'pdfs' && <PdfManagement />}
          {currentTab === 'reports' && <AdvancedExcelReports activeSessionId={activeSessionId} />}
          {currentTab === 'audit' && <ProcessingHistoryAudit />}
          {currentTab === 'settings' && <StaffSettings />}
        </div>
      </Layout>
    </DossierProvider>
  );
};

import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
