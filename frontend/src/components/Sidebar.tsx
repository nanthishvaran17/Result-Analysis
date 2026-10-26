import React from 'react';
import {
  LayoutDashboard,
  Users,
  PlayCircle,
  BarChart3,
  FileText,
  FileSpreadsheet,
  History,
  ShieldCheck,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, isAdmin } = useAuth();

  const primaryNavigation = [
    { id: 'dashboard', name: 'Overview Dashboard', icon: LayoutDashboard, badge: 'Live' },
    { id: 'students', name: 'Student Registry', icon: Users, badge: null },
    { id: 'automation', name: 'Automation Center', icon: PlayCircle, badge: 'Sync' },
    { id: 'results', name: 'Result Analysis', icon: BarChart3, badge: null },
  ];

  const reportsNavigation = [
    { id: 'reports', name: 'Enterprise Excel Reports', icon: FileSpreadsheet, badge: '5-Sheet' },
    { id: 'pdfs', name: 'Marksheet PDF Center', icon: FileText, badge: null },
    { id: 'audit', name: 'Processing Audit Trail', icon: History, badge: null },
    ...(isAdmin ? [{ id: 'settings', name: 'Staff & Security', icon: ShieldCheck, badge: 'Admin' }] : []),
  ];

  return (
    <aside className="w-68 bg-slate-950 text-white flex flex-col border-r border-slate-800/80 select-none shadow-2xl relative z-30">
      {/* Brand Header */}
      <div className="h-17 flex items-center px-5 border-b border-slate-800/90 bg-linear-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-[13px] tracking-wider text-white font-heading flex items-center gap-1.5">
            <span>EXAM PORTAL</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              PRO
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate">Office of the Controller</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-5 px-3.5 space-y-6 overflow-y-auto">
        {/* Core Operations */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Academic Pipeline</span>
          </div>
          {primaryNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group text-left ${
                  isActive
                    ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 font-bold scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-900/90 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Intelligence, Reports & Audit */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Reports & Compliance
          </div>
          {reportsNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group text-left ${
                  isActive
                    ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 font-bold scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-900/90 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Footer Chip */}
      <div className="p-3.5 border-t border-slate-800/90 bg-linear-to-b from-slate-950 to-slate-900">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-8.5 h-8.5 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-xs font-extrabold text-white shadow-sm ring-1 ring-white/10 shrink-0">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-200 truncate">{user?.full_name || 'Staff User'}</div>
            <div className="text-[10px] text-emerald-400 font-mono tracking-tight flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{user?.role || 'EXAM_STAFF'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
