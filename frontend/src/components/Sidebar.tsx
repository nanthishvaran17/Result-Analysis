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
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, isAdmin } = useAuth();

  const primaryNavigation = [
    { id: 'dashboard', name: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'students', name: 'Student Registry', icon: Users },
    { id: 'automation', name: 'Automation Center', icon: PlayCircle },
    { id: 'results', name: 'Result Analysis', icon: BarChart3 },
  ];

  const reportsNavigation = [
    { id: 'reports', name: 'Enterprise Excel Reports', icon: FileSpreadsheet },
    { id: 'pdfs', name: 'Marksheet PDF Center', icon: FileText },
    { id: 'audit', name: 'Processing Audit Trail', icon: History },
    ...(isAdmin ? [{ id: 'settings', name: 'Staff & Security', icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="w-64 bg-slate-950 text-white flex flex-col border-r border-slate-800/80 select-none shadow-xl relative z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 bg-slate-900/60">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white mr-3 shadow-md shadow-blue-600/30">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-sm tracking-tight text-white font-heading">
            EXAM PORTAL
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate">
            Office of the Controller
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {/* Core Operations */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Operations
          </div>
          {primaryNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mr-3 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-800/60 pt-3">
          <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Reports & Records
          </div>
          <div className="space-y-1">
            {reportsNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mr-3 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Footer Chip */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-200 truncate">{user?.full_name || 'Staff User'}</div>
            <div className="text-[10px] text-emerald-400 font-mono tracking-tight flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{user?.role || 'EXAM_STAFF'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
