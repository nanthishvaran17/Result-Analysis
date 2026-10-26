import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  BookOpen,
  Eye
} from 'lucide-react';
import { api } from '../api/client';
import { PdfViewerModal } from './PdfViewerModal';
import type { Student } from '../types';

interface StudentDossierDrawerProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentDossierDrawer: React.FC<StudentDossierDrawerProps> = ({ student, onClose }) => {
  const [resultsHistory, setResultsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');

  useEffect(() => {
    if (!student) {
      setResultsHistory([]);
      return;
    }

    setLoading(true);
    api.get<any[]>(`/results/student/${student.id}`)
      .then((data) => setResultsHistory(data))
      .catch(() => setResultsHistory([]))
      .finally(() => setLoading(false));
  }, [student]);

  if (!student) return null;

  const latestResult = resultsHistory[0] || null;

  const handlePreviewPdf = () => {
    const token = localStorage.getItem('token');
    // Fetch latest PDF for this student
    fetch(`/api/v1/pdfs?search=${encodeURIComponent(student.register_number)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          const pdfItem = data.items[0];
          return fetch(`/api/v1/pdfs/${pdfItem.id}/download`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.blob())
            .then((blob) => {
              const url = window.URL.createObjectURL(blob);
              setPreviewPdfUrl(url);
              setPreviewFileName(pdfItem.file_name);
            });
        } else {
          alert('No verified marksheet PDF found for this student.');
        }
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md ring-2 ring-white/10 shrink-0">
              {student.name[0]}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-white truncate">{student.name}</h2>
              <div className="text-xs font-mono text-blue-400 mt-0.5">{student.register_number}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Department</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{student.department_code}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Batch Cohort</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{student.batch}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Current Semester</span>
              <span className="font-bold text-slate-900 mt-0.5 block">Semester {student.current_semester}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Class Section</span>
              <span className="font-bold text-slate-900 mt-0.5 block">Section {student.section}</span>
            </div>
          </div>

          {/* Academic Standing KPI Card */}
          {latestResult ? (
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Session Performance: {latestResult.session_code}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    latestResult.result_status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {latestResult.result_status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                  <div className="text-[10px] text-slate-300">Semester GPA</div>
                  <div className="text-xl font-extrabold text-white mt-0.5 font-mono">
                    {Number(latestResult.gpa).toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                  <div className="text-[10px] text-slate-300">Earned Credits</div>
                  <div className="text-xl font-extrabold text-white mt-0.5 font-mono">
                    {latestResult.earned_credits} / {latestResult.total_credits}
                  </div>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                  <div className="text-[10px] text-slate-300">Standing Arrears</div>
                  <div className={`text-xl font-extrabold mt-0.5 font-mono ${latestResult.standing_arrears_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {latestResult.standing_arrears_count}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              No examination records recorded yet for the current session.
            </div>
          )}

          {/* Subject Results Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Course Results Breakdown</span>
              </h3>
              <button
                onClick={handlePreviewPdf}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Marksheet PDF</span>
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading academic breakdown...</div>
            ) : latestResult?.subjects && latestResult.subjects.length > 0 ? (
              <div className="space-y-2">
                {latestResult.subjects.map((sub: any, idx: number) => {
                  const isFail = ['RA', 'SA', 'AB', 'W'].includes(sub.grade);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{sub.subject_code}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium">
                            {sub.credits} Credits
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{sub.subject_name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                            isFail
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {sub.grade}
                        </span>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {sub.result_status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Run the Automation Center to evaluate and persist courses for this candidate.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-400">
            Registered: {new Date(student.created_at).toLocaleDateString()}
          </div>
          <button
            onClick={handlePreviewPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Open Official Grade Sheet</span>
          </button>
        </div>
      </div>

      <PdfViewerModal
        isOpen={!!previewPdfUrl}
        onClose={() => {
          if (previewPdfUrl) window.URL.revokeObjectURL(previewPdfUrl);
          setPreviewPdfUrl(null);
        }}
        pdfUrl={previewPdfUrl}
        fileName={previewFileName}
      />
    </div>
  );
};
