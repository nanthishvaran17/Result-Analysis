import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ExcelReportItem, ExamSession, Department } from '../types';

interface AdvancedExcelReportsProps {
  activeSessionId: number | null;
}

export const AdvancedExcelReports: React.FC<AdvancedExcelReportsProps> = ({ activeSessionId }) => {
  const { isStaff } = useAuth();
  const [reports, setReports] = useState<ExcelReportItem[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | ''>(activeSessionId || '');
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [selectedBatch, setSelectedBatch] = useState<string>('2022-2026');
  const [selectedSemester, setSelectedSemester] = useState<number>(5);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      setError('Please select an examination session.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setGenerating(true);

    try {
      const report = await api.post<ExcelReportItem>('/reports/generate', {
        session_id: selectedSession,
        department_code: selectedDept || null,
        batch: selectedBatch || null,
        semester: selectedSemester || null,
      });
      setSuccessMsg(`Report generated & verified successfully: ${report.report_name}`);
      const updated = await api.get<ExcelReportItem[]>('/reports?limit=20');
      setReports(updated);
    } catch (err: any) {
      setError(err.message || 'Report generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (reportId: number, filename: string) => {
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
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="p-8 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Excel Engine & Report Repository</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate openpyxl workbooks with 5 synchronized worksheets, institutional styling, and automated post-generation validation.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Generation Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Generate Multi-Sheet Excel Report</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            5 Worksheets Automated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-hidden"
            >
              <option value="">Select Session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-hidden"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-hidden"
            >
              <option value="2022-2026">2022-2026</option>
              <option value="2023-2027">2023-2027</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-hidden"
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
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-700 mb-2 uppercase tracking-wider">
            Automated Worksheets Included in Workbook:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
            <div className="p-2 bg-white rounded-md border border-slate-200">
              <span className="font-bold block text-slate-800">1. Result Analysis</span>
              <span className="text-[10px] text-slate-500">Student matrix & GPA</span>
            </div>
            <div className="p-2 bg-white rounded-md border border-slate-200">
              <span className="font-bold block text-slate-800">2. Summary</span>
              <span className="text-[10px] text-slate-500">Grade distributions</span>
            </div>
            <div className="p-2 bg-white rounded-md border border-slate-200">
              <span className="font-bold block text-slate-800">3. Arrear Analysis</span>
              <span className="text-[10px] text-slate-500">Failed courses breakdown</span>
            </div>
            <div className="p-2 bg-white rounded-md border border-slate-200">
              <span className="font-bold block text-slate-800">4. Processing Log</span>
              <span className="text-[10px] text-slate-500">Audit & timestamp trace</span>
            </div>
            <div className="p-2 bg-white rounded-md border border-slate-200">
              <span className="font-bold block text-slate-800">5. Subject Mapping</span>
              <span className="text-[10px] text-slate-500">Course credits & titles</span>
            </div>
          </div>
        </div>

        {isStaff && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating & Validating Workbook...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Generate Validated Report</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Reports History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900">Generated Reports Version History</h3>
          <span className="text-xs text-slate-400">{reports.length} Reports Archived</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Report File Name</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Candidates</th>
                <th className="py-3 px-4 text-center">Pass %</th>
                <th className="py-3 px-4 text-center">Validation Status</th>
                <th className="py-3 px-4">Generated By</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reports.length > 0 ? (
                reports.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[260px]">{r.report_name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{r.session_code || r.session_id}</td>
                    <td className="py-3 px-4 text-slate-600">{r.department_code || 'ALL'}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{r.total_students}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{r.pass_percentage}%</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.is_valid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {r.is_valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{r.is_valid ? 'Integrity Verified' : 'Corrupted'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {r.generated_by} • {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDownload(r.id, r.report_name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-semibold text-[11px] border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download (.xlsx)</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No reports generated yet. Click 'Generate Validated Report' to produce a 5-sheet workbook.
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
