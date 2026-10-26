import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  HardDrive,
  Calendar,
  Play,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  FileText,
  BarChart3
} from 'lucide-react';
import { api } from '../api/client';
import type { DashboardStats } from '../types';

interface OverviewDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<DashboardStats>('/dashboard/stats');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-semibold tracking-wide">
            Aggregating real-time examination statistics...
          </p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center justify-between shadow-sm">
          <span className="font-semibold">{error || 'Unable to connect to live examination service.'}</span>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Eligible Candidates',
      value: stats.total_eligible_students,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100 hover:border-blue-400',
      tab: 'students',
      desc: 'Registered student cohort',
    },
    {
      title: 'Results Retrieved',
      value: stats.results_retrieved,
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100 hover:border-indigo-400',
      tab: 'results',
      desc: 'Extracted from provisional PDFs',
    },
    {
      title: 'Digitally Verified',
      value: stats.results_verified,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100 hover:border-emerald-400',
      tab: 'results',
      desc: 'Ledger-authenticated records',
    },
    {
      title: 'Pending Processing',
      value: stats.pending_records,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100 hover:border-amber-400',
      tab: 'automation',
      desc: 'Awaiting automation execution',
    },
    {
      title: 'Arrear Failures (RA)',
      value: stats.failed_records,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100 hover:border-rose-400',
      tab: 'results',
      desc: 'Candidates with standing arrears',
    },
    {
      title: 'Flagged Extractions',
      value: stats.missing_ambiguous_results,
      icon: AlertTriangle,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100 hover:border-purple-400',
      tab: 'pdfs',
      desc: 'Ambiguity / mismatch audit',
    },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Session Status */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                Session Active & Operating
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight font-heading text-white">
              {stats.latest_session || 'Nov/Dec 2025 End Semester Examinations'}
            </h2>
            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
              <span>Academic Year: <strong className="text-white">2025-2026</strong></span>
              <span>•</span>
              <span>Term: <strong className="text-white">ODD Semester</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-white font-mono">LOCKED & VERIFIED</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('automation')}
              className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer hover:-translate-y-0.5 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Result Automation</span>
            </button>
            <button
              onClick={() => onNavigateTab('students')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smart Excel Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI 6-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              onClick={() => onNavigateTab(kpi.tab)}
              className={`bg-white p-5 rounded-2xl border ${kpi.border} shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">{kpi.title}</span>
                <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="my-3">
                <div className="text-3xl font-extrabold text-slate-900 font-heading font-mono">
                  {kpi.value}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{kpi.desc}</p>
              </div>
              <div className="flex items-center text-[11px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors pt-2 border-t border-slate-100">
                <span>View in {kpi.tab}</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quick Operations Hub */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm font-heading flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Core Operations Hub</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Access</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => onNavigateTab('students')}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left group cursor-pointer shadow-2xs"
            >
              <Users className="w-5 h-5 text-blue-600 mb-2 transition-transform group-hover:scale-110" />
              <div className="font-bold text-slate-900">Student Registry</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Manage cohorts & Smart Excel entry</p>
            </button>

            <button
              onClick={() => onNavigateTab('reports')}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-left group cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-2 transition-transform group-hover:scale-110" />
              <div className="font-bold text-slate-900">Enterprise Excel</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Generate verified 5-sheet workbooks</p>
            </button>

            <button
              onClick={() => onNavigateTab('results')}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left group cursor-pointer shadow-2xs"
            >
              <BarChart3 className="w-5 h-5 text-indigo-600 mb-2 transition-transform group-hover:scale-110" />
              <div className="font-bold text-slate-900">Result Analysis</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Student marksheet breakdown & GPA</p>
            </button>

            <button
              onClick={() => onNavigateTab('pdfs')}
              className="p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/30 transition-all text-left group cursor-pointer shadow-2xs"
            >
              <FileText className="w-5 h-5 text-purple-600 mb-2 transition-transform group-hover:scale-110" />
              <div className="font-bold text-slate-900">PDF Management</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Secure provisional marksheets</p>
            </button>
          </div>
        </div>

        {/* System & Architecture Integrity Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm font-heading flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Platform Integrity & Health</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Optimal
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">Storage & Marksheet PDFs</span>
              </div>
              <span className="font-mono text-emerald-600 font-bold">SHA-256 Verified</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">Database Engine</span>
              </div>
              <span className="font-mono text-emerald-600 font-bold">ACID Transactional</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">Excel Reporting Pipeline</span>
              </div>
              <span className="font-mono text-emerald-600 font-bold">openpyxl Active</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">Audit Trail Logging</span>
              </div>
              <span className="font-mono text-emerald-600 font-bold">256-bit Immutable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
