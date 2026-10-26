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
  ArrowUpRight
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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Fetching live examination statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <span>{error || 'Unable to load dashboard data.'}</span>
          <button
            onClick={fetchStats}
            className="px-3 py-1 bg-red-600 text-white rounded-md font-semibold"
          >
            Retry
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
      border: 'border-blue-100',
      tab: 'students',
      desc: 'Active student registry',
    },
    {
      title: 'Results Retrieved',
      value: stats.results_retrieved,
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      tab: 'results',
      desc: 'Fetched from official portal',
    },
    {
      title: 'Results Verified',
      value: stats.results_verified,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      tab: 'results',
      desc: 'Digitally verified marksheets',
    },
    {
      title: 'Pending Records',
      value: stats.pending_records,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      tab: 'automation',
      desc: 'Awaiting automation run',
    },
    {
      title: 'Failed Examinations',
      value: stats.failed_records,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      tab: 'results',
      desc: 'Candidates with arrears (RA)',
    },
    {
      title: 'Ambiguous / Mismatch',
      value: stats.missing_ambiguous_results,
      icon: AlertTriangle,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      tab: 'pdfs',
      desc: 'Flagged PDF extractions',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Top Banner / Session Status */}
      <div className="bg-slate-900 rounded-xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Active Examination Session</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{stats.latest_session || 'No Session Active'}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Continuous Result Processing & Enterprise Report Generation Engine
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('automation')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Automation Center</span>
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab(kpi.tab)}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">{kpi.title}</div>
                <div className="text-[11px] text-slate-400 mt-1">{kpi.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: System Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health & Export Overview */}
        <div className="space-y-6">
          {/* Latest Excel Export Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Latest Validated Excel Export</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Verified
              </span>
            </div>
            {stats.latest_excel_export ? (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {stats.latest_excel_export.report_name}
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50 rounded-lg p-2 text-center text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Cohort Size</span>
                    <span className="font-bold text-slate-800">{stats.latest_excel_export.total_students}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Pass Rate</span>
                    <span className="font-bold text-emerald-700">{stats.latest_excel_export.pass_percentage}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Generated By</span>
                    <span className="font-bold text-slate-800">{stats.latest_excel_export.generated_by}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">
                  Exported on: {new Date(stats.latest_excel_export.created_at).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No verified export generated yet. Click 'Export Reports' to produce a 5-sheet workbook.
              </div>
            )}
          </div>

          {/* Engine Infrastructure & Health */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-3 border-b border-slate-100">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>System Infrastructure & Storage</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-[10px] block">Database Status</span>
                <span className="font-bold text-emerald-600">{stats.system_health.database}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-[10px] block">Free Storage</span>
                <span className="font-bold text-slate-800">{stats.system_health.storage_free_gb} GB Available</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-[10px] block">Active Background Tasks</span>
                <span className="font-bold text-slate-800">{stats.system_health.active_background_jobs}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-[10px] block">Service Status</span>
                <span className="font-bold text-emerald-600">{stats.system_health.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Recent Activity & Audit Trail</span>
            </div>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View Full Logs
            </button>
          </div>
          <div className="mt-3 flex-1 overflow-y-auto space-y-3">
            {stats.recent_activities.length > 0 ? (
              stats.recent_activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs border border-slate-100"
                >
                  <div>
                    <span className="font-bold text-slate-800 mr-2">{act.action}</span>
                    <span className="text-slate-500">{act.target}</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      By {act.username} • {new Date(act.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      act.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No recent logs recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
