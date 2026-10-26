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

  const navigation = [
    { id: 'dashboard', name: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'students', name: 'Student Registry', icon: Users },
    { id: 'automation', name: 'Automation Center', icon: PlayCircle },
    { id: 'results', name: 'Result Analysis', icon: BarChart3 },
    { id: 'pdfs', name: 'PDF Management', icon: FileText },
    { id: 'reports', name: 'Advanced Excel Reports', icon: FileSpreadsheet },
    { id: 'audit', name: 'Processing Audit', icon: History },
    ...(isAdmin ? [{ id: 'settings', name: 'Staff & Settings', icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950/60">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white mr-3 shadow-md shadow-blue-500/20">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-sm tracking-wide text-slate-100">EXAM AUTOMATION</div>
          <div className="text-[10px] text-slate-400 font-medium">Enterprise Controller Office</div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Core Operations
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* User Footer Chip */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">{user?.full_name}</div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
