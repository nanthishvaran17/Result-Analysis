import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { ExcelReportItem, ExamSession, Department } from '../types';

interface AdvancedExcelReportsProps {
  activeSessionId: number | null;
}

export const AdvancedExcelReports: React.FC<AdvancedExcelReportsProps> = ({ activeSessionId }) => {
  const { isStaff } = useAuth();
  const { success, error: toastError } = useToast();

  const [reports, setReports] = useState<ExcelReportItem[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | ''>(activeSessionId || '');
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [selectedBatch, setSelectedBatch] = useState<string>('2022-2026');
  const [selectedSemester, setSelectedSemester] = useState<number>(5);

  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [reps, sess, depts] = await Promise.all([
        api.get<ExcelReportItem[]>('/reports?limit=20'),
        api.get<ExamSession[]>('/sessions'),
        api.get<Department[]>('/students/departments'),
      ]);
      setReports(reps);
      setSessions(sess);
      setDepartments(depts);
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeSessionId) setSelectedSession(activeSessionId);
  }, [activeSessionId]);

  const handleGenerateReport = async () => {
    if (!selectedSession) {
      toastError('Please select an active examination session.');
      return;
    }
    setGenerating(true);

    try {
      const report = await api.post<ExcelReportItem>('/reports/generate', {
        session_id: selectedSession,
        department_code: selectedDept || null,
        batch: selectedBatch || null,
        semester: selectedSemester || null,
      });
      success(`Generated & validated 5-sheet workbook: ${report.report_name}`);
      const updated = await api.get<ExcelReportItem[]>('/reports?limit=20');
      setReports(updated);
    } catch (err: any) {
      toastError(err.message || 'Report generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (reportId: number, filename: string) => {
    setDownloadingId(reportId);
    const token = localStorage.getItem('token');
    const url = `/api/v1/reports/${reportId}/download`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        success(`Downloaded ${filename}`);
      })
      .catch((err) => toastError(err.message))
      .finally(() => setDownloadingId(null));
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title Banner */}
      <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                openpyxl Enterprise Engine
              </span>
              <span className="text-slate-400 text-xs">• 5 Synchronized Sheets</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight font-heading text-white">
              Enterprise Excel Engine & Report Repository
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Automated multi-sheet institutional Excel workbooks with formula synchronization, automatic cell formatting, and post-generation data verification.
            </p>
          </div>
        </div>
      </div>

      {/* Generation Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm font-heading">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Generate Multi-Sheet Excel Workbook</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formula-Driven openpyxl</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Examination Session *</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="">Select Session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_code} {s.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="2022-2026">2022-2026</option>
              <option value="2023-2027">2023-2027</option>
              <option value="2024-2028">2024-2028</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Worksheets Manifest Preview */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
          <div className="text-[11px] font-bold text-slate-700 mb-2.5 uppercase tracking-wider">
            5 Automated Worksheets Included:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="font-extrabold block text-slate-900 font-mono">1. Result Analysis</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Student course matrix & GPA</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="font-extrabold block text-slate-900 font-mono">2. Summary</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Subject grade distribution</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="font-extrabold block text-slate-900 font-mono">3. Arrear Analysis</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Course failure diagnostics</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="font-extrabold block text-slate-900 font-mono">4. Processing Log</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Audit trails & timestamps</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="font-extrabold block text-slate-900 font-mono">5. Subject Mapping</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Credits & syllabus lookup</span>
            </div>
          </div>
        </div>

        {isStaff && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50 hover:-translate-y-0.5 active:scale-95"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating & Validating Worksheets...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Generate Enterprise Report</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Generated Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="font-extrabold text-slate-900 text-sm font-heading">
            Historical Workbooks & Verified Reports
          </div>
          <span className="text-xs text-slate-500 font-semibold">{reports.length} Reports Archived</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
              <tr>
                <th className="py-3 px-4">Report Filename</th>
                <th className="py-3 px-4">Department / Cohort</th>
                <th className="py-3 px-4 text-center">Candidates</th>
                <th className="py-3 px-4 text-center">File Size</th>
                <th className="py-3 px-4 text-center">Validation Status</th>
                <th className="py-3 px-4">Generated At</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reports.length > 0 ? (
                reports.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{r.report_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {r.department_code || 'ALL DEPARTMENTS'}{' '}
                      {r.batch && <span className="text-slate-400 font-normal font-mono">• {r.batch}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-800">
                      {r.total_students}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {(r.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.is_valid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Structure Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Validation Warning</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownload(r.id, r.report_name)}
                        disabled={downloadingId === r.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                      >
                        {downloadingId === r.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>.XLSX</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                      <h4 className="text-sm font-bold text-slate-700">No Excel Reports Generated</h4>
                      <p className="text-xs text-slate-400">
                        Select a session and click "Generate Enterprise Report" to produce verified institutional 5-sheet workbooks.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
