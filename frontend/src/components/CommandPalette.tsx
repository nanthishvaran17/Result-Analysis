import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Layers,
  ArrowRight,
  X,
  PlayCircle,
  Command
} from 'lucide-react';
import { api } from '../api/client';
import type { Student } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onSelectStudent?: (student: Student) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectStudent,
}) => {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setStudents([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setStudents([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<{ items: Student[] }>(`/students?search=${encodeURIComponent(query)}&limit=6`);
        setStudents(res.items || []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const quickNav = [
    { title: 'Overview Dashboard', tab: 'dashboard', icon: BarChart3, desc: 'Live candidate & session statistics' },
    { title: 'Dynamic Result Matrix', tab: 'results', icon: Layers, desc: 'Subject-by-subject grades & GPA' },
    { title: 'Automation Center', tab: 'automation', icon: PlayCircle, desc: 'Live portal sync & batch verification' },
    { title: 'Enterprise Excel Reports', tab: 'reports', icon: FileSpreadsheet, desc: '5-sheet validated workbooks' },
    { title: 'Verified Marksheets', tab: 'pdfs', icon: FileText, desc: 'Preview and download marksheet PDFs' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-20 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-blue-600 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidate name, register number (7100...), or navigate pages..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-200/60 border border-slate-300 text-[10px] font-mono text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Matching Students */}
          {query.length >= 2 && (
            <div>
              <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
                <span>Matching Candidates ({students.length})</span>
                {loading && <span className="text-blue-600 animate-pulse">Searching...</span>}
              </div>
              {students.length > 0 ? (
                <div className="space-y-1">
                  {students.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onClose();
                        if (onSelectStudent) onSelectStudent(s);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/80 border border-transparent hover:border-blue-100 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100/70 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {s.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                            {s.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {s.register_number} • {s.department_code} • Sem {s.current_semester}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !loading && (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No candidates found matching "{query}".
                  </div>
                )
              )}
            </div>
          )}

          {/* Quick Page Navigation */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Quick System Navigation
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {quickNav.map((nav) => {
                const Icon = nav.icon;
                return (
                  <div
                    key={nav.tab}
                    onClick={() => {
                      onClose();
                      onNavigateTab(nav.tab);
                    }}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                        {nav.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{nav.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5" />
            <span>Use Arrow keys or Click to navigate</span>
          </div>
          <div>Enterprise COE Search Engine</div>
        </div>
      </div>
    </div>
  );
};
