import React, { useEffect, useState } from 'react';
import {
  Search,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Award,
  Download,
  ShieldCheck,
  Percent,
  Users
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import type { ResultMatrix, Department, StudentMatrixRow } from '../types';

interface ResultAnalysisProps {
  activeSessionId: number | null;
  onNavigateTab: (tab: string) => void;
}

export const ResultAnalysis: React.FC<ResultAnalysisProps> = ({ activeSessionId, onNavigateTab }) => {
  const { isStaff } = useAuth();
  const { success, error: toastError } = useToast();

  const [matrix, setMatrix] = useState<ResultMatrix | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [selectedBatch, setSelectedBatch] = useState<string>('2022-2026');
  const [selectedSemester, setSelectedSemester] = useState<number | ''>(5);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // Marksheet inspection modal
  const [inspectedRow, setInspectedRow] = useState<StudentMatrixRow | null>(null);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeSessionId) params.append('session_id', activeSessionId.toString());
      if (selectedDept) params.append('department_code', selectedDept);
      if (selectedBatch) params.append('batch', selectedBatch);
      if (selectedSemester) params.append('semester', selectedSemester.toString());

      const data = await api.get<ResultMatrix>(`/results/matrix?${params.toString()}`);
      setMatrix(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch result matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get<Department[]>('/students/departments').then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    fetchMatrix();
  }, [activeSessionId, selectedDept, selectedBatch, selectedSemester]);

  const handleVerify = async (resultId: number, studentRegNo: string) => {
    try {
      setVerifyingId(resultId);
      await api.post(`/results/${resultId}/verify`);
      success(`Marksheet for ${studentRegNo} digitally verified!`);
      fetchMatrix();
      if (inspectedRow && inspectedRow.student_id === resultId) {
        setInspectedRow({ ...inspectedRow, is_verified: true });
      }
    } catch (err: any) {
      toastError(err.message || 'Verification failed.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDownloadPdf = (regNo: string) => {
    const token = localStorage.getItem('token');
    const sessCode = matrix?.session_code || 'SESSION';
    const filename = `${regNo}_${sessCode}.pdf`;

    fetch(`/api/v1/pdfs/download/${filename}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Official PDF marksheet not yet generated for this student.');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        success(`Downloaded marksheet PDF for ${regNo}`);
      })
      .catch((err) => toastError(err.message));
  };

  const filteredRows = matrix
    ? matrix.rows.filter(
        (r) =>
          r.register_number.toLowerCase().includes(search.toLowerCase()) ||
          r.student_name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Examination Ledger
              </span>
              <span className="text-slate-400 text-xs">
                • Active Session: <strong className="text-white">{matrix?.session_code || 'Loading...'}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight font-heading text-white">
              Dynamic Result Analysis Matrix
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Student-by-student academic performance matrix, verified course credits, SGPA computation, and arrear analytics.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Generate 5-Sheet Excel Workbook</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      {matrix && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Total Evaluated
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2 font-heading font-mono">
              {matrix.total_students}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Active candidates in cohort</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">
                All Cleared (Pass)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-2 font-heading font-mono">
              {matrix.passed_students}
            </div>
            <span className="text-[11px] text-emerald-600/80 mt-1 block">Zero standing arrears</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-rose-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-rose-600 font-bold uppercase tracking-wider">
                Arrear Candidates
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-rose-700 mt-2 font-heading font-mono">
              {matrix.failed_students}
            </div>
            <span className="text-[11px] text-rose-600/80 mt-1 block">Requires re-appearance (RA)</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">
                Overall Pass Rate
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-indigo-700 mt-2 font-heading font-mono">
              {matrix.pass_percentage}%
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Avg GPA: <strong className="text-slate-700 font-mono">{matrix.average_gpa}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by register number or student name..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="2022-2026">2022-2026</option>
            <option value="2023-2027">2023-2027</option>
            <option value="2024-2028">2024-2028</option>
          </select>

          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Results Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
              <tr>
                <th className="py-3.5 px-3 border-r border-slate-800 text-center w-12">#</th>
                <th className="py-3.5 px-3 border-r border-slate-800">Register No</th>
                <th className="py-3.5 px-3 border-r border-slate-800 min-w-[170px]">Student Name</th>
                <th className="py-3.5 px-2 border-r border-slate-800 text-center">Branch</th>
                <th className="py-3.5 px-2 border-r border-slate-800 text-center">Sem</th>
                {/* Dynamic Subject Columns */}
                {matrix?.columns.map((col) => (
                  <th
                    key={col.code}
                    title={col.name}
                    className="py-3.5 px-2 border-r border-slate-800 text-center min-w-[75px]"
                  >
                    <div className="font-extrabold text-blue-300">{col.code}</div>
                    <div className="text-[9px] text-slate-400 font-normal lowercase">{col.credits} cr</div>
                  </th>
                ))}
                <th className="py-3.5 px-3 border-r border-slate-800 text-center">Curr Arr</th>
                <th className="py-3.5 px-3 border-r border-slate-800 text-center">Standing Arr</th>
                <th className="py-3.5 px-3 border-r border-slate-800 text-center">SGPA</th>
                <th className="py-3.5 px-3 border-r border-slate-800 text-center">Status</th>
                <th className="py-3.5 px-3 text-center">Inspection & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9 + (matrix?.columns.length || 0)} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-600">Calculating real-time academic ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length > 0 ? (
                filteredRows.map((row, idx) => (
                  <tr
                    key={row.student_id}
                    className={`hover:bg-blue-50/40 transition-colors group ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 border-r border-slate-100">
                      {row.register_number}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 border-r border-slate-100">
                      {row.student_name}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-700 font-semibold border-r border-slate-100">
                      {row.department_code}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-700 border-r border-slate-100">
                      {row.semester}
                    </td>

                    {/* Dynamic Grade Cells */}
                    {matrix?.columns.map((col) => {
                      const grade = row.grades[col.code] || '-';
                      const isArrear = ['RA', 'SA', 'AB', 'W'].includes(grade);
                      const isHigh = ['O', 'A+'].includes(grade);
                      return (
                        <td
                          key={col.code}
                          className={`py-3 px-2 text-center font-bold border-r border-slate-100 ${
                            isArrear
                              ? 'bg-rose-50 text-rose-700'
                              : isHigh
                              ? 'bg-emerald-50/60 text-emerald-700'
                              : grade !== '-'
                              ? 'text-slate-800'
                              : 'text-slate-300'
                          }`}
                        >
                          {grade}
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-center font-bold border-r border-slate-100">
                      <span
                        className={
                          row.arrears_count > 0
                            ? 'px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-extrabold border border-rose-200'
                            : 'text-slate-400'
                        }
                      >
                        {row.arrears_count}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold border-r border-slate-100">
                      <span
                        className={
                          row.standing_arrears_count > 0
                            ? 'px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-extrabold border border-amber-200'
                            : 'text-slate-400'
                        }
                      >
                        {row.standing_arrears_count}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-extrabold font-mono text-blue-700 border-r border-slate-100 text-sm">
                      {row.gpa.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center border-r border-slate-100">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.result_status === 'PASS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {row.result_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setInspectedRow(row)}
                          title="View Marksheet Breakdown"
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3 h-3 text-blue-600" />
                          <span>Inspect</span>
                        </button>
                        {row.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        ) : isStaff ? (
                          <button
                            onClick={() => handleVerify(row.student_id, row.register_number)}
                            disabled={verifyingId === row.student_id}
                            className="px-2.5 py-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            {verifyingId === row.student_id ? 'Verifying...' : 'Verify'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Pending</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9 + (matrix?.columns.length || 0)} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <h4 className="text-sm font-bold text-slate-700">No Examination Results Available</h4>
                      <p className="text-xs text-slate-400">
                        No result records found for this cohort in the current session. Run Result Automation or verify marks to populate ledger.
                      </p>
                      <button
                        onClick={() => onNavigateTab('automation')}
                        className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        Go to Automation Center
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Marksheet Detailed Inspection Modal */}
      <Modal
        isOpen={Boolean(inspectedRow)}
        onClose={() => setInspectedRow(null)}
        title={`Candidate Marksheet Inspection: ${inspectedRow?.register_number}`}
        subtitle={`${inspectedRow?.student_name} • ${inspectedRow?.department_code} • Semester ${inspectedRow?.semester}`}
        icon={<Award className="w-5 h-5 text-indigo-600" />}
        maxWidth="max-w-3xl"
      >
        {inspectedRow && (
          <div className="space-y-5 text-xs">
            {/* Quick KPI Strip */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">SGPA</span>
                <span className="text-xl font-extrabold text-blue-600 font-mono">
                  {inspectedRow.gpa.toFixed(2)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Current Arrears</span>
                <span className={`text-xl font-extrabold font-mono ${inspectedRow.arrears_count > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {inspectedRow.arrears_count}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Standing Arrears</span>
                <span className={`text-xl font-extrabold font-mono ${inspectedRow.standing_arrears_count > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {inspectedRow.standing_arrears_count}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Final Result</span>
                <span className={`text-base font-extrabold block mt-1 ${inspectedRow.result_status === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {inspectedRow.result_status}
                </span>
              </div>
            </div>

            {/* Courses Breakdown Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Course Code</th>
                    <th className="py-2.5 px-3">Course Name</th>
                    <th className="py-2.5 px-3 text-center">Credits</th>
                    <th className="py-2.5 px-3 text-center">Letter Grade</th>
                    <th className="py-2.5 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {matrix?.columns.map((col) => {
                    const grade = inspectedRow.grades[col.code] || '-';
                    const isArrear = ['RA', 'SA', 'AB', 'W'].includes(grade);
                    return (
                      <tr key={col.code} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{col.code}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{col.name}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-600">{col.credits}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold font-mono text-xs ${
                              isArrear
                                ? 'bg-rose-100 text-rose-700'
                                : grade !== '-'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'text-slate-300'
                            }`}
                          >
                            {grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isArrear
                                ? 'bg-rose-50 text-rose-700'
                                : grade !== '-'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {isArrear ? 'FAIL' : grade !== '-' ? 'PASS' : '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {inspectedRow.is_verified ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Digitally Authenticated Marksheet</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleVerify(inspectedRow.student_id, inspectedRow.register_number)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Authenticate Marksheet
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(inspectedRow.register_number)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download Official PDF</span>
                </button>
                <button
                  onClick={() => setInspectedRow(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
