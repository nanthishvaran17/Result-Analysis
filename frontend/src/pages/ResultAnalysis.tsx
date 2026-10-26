import React, { useEffect, useState } from 'react';
import {
  Search,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ResultMatrix, Department } from '../types';

interface ResultAnalysisProps {
  activeSessionId: number | null;
  onNavigateTab: (tab: string) => void;
}

export const ResultAnalysis: React.FC<ResultAnalysisProps> = ({ activeSessionId, onNavigateTab }) => {
  const { isStaff } = useAuth();
  const [matrix, setMatrix] = useState<ResultMatrix | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [selectedBatch, setSelectedBatch] = useState<string>('2022-2026');
  const [selectedSemester, setSelectedSemester] = useState<number | ''>(5);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

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
    } catch {
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

  const handleVerify = async (resultId: number) => {
    try {
      setVerifyingId(resultId);
      await api.post(`/results/${resultId}/verify`);
      fetchMatrix();
    } catch {
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredRows = matrix
    ? matrix.rows.filter(
        (r) =>
          r.register_number.toLowerCase().includes(search.toLowerCase()) ||
          r.student_name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="p-8 space-y-6">
      {/* Title & Quick Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dynamic Result Analysis Matrix</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Student-by-student academic performance with dynamic course columns, GPA, and standing arrears.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('reports')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Generate 5-Sheet Excel Report</span>
        </button>
      </div>

      {/* Summary KPI Ribbon */}
      {matrix && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Total Evaluated
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{matrix.total_students}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider block">
              Passed Students
            </span>
            <span className="text-xl font-bold text-emerald-700 mt-0.5 block">{matrix.passed_students}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider block">
              Arrears (Failures)
            </span>
            <span className="text-xl font-bold text-rose-700 mt-0.5 block">{matrix.failed_students}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider block">
              Pass Rate %
            </span>
            <span className="text-xl font-bold text-blue-700 mt-0.5 block">{matrix.pass_percentage}%</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name or register number..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden cursor-pointer"
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
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="2022-2026">2022-2026</option>
            <option value="2023-2027">2023-2027</option>
          </select>

          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value ? Number(e.target.value) : '')}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden cursor-pointer"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-3 border-r border-slate-800 text-center w-12">#</th>
                <th className="py-3 px-3 border-r border-slate-800">Register No</th>
                <th className="py-3 px-3 border-r border-slate-800 min-w-[160px]">Student Name</th>
                <th className="py-3 px-2 border-r border-slate-800 text-center">Branch</th>
                <th className="py-3 px-2 border-r border-slate-800 text-center">Sem</th>
                {/* Dynamic Subject Columns */}
                {matrix?.columns.map((col) => (
                  <th
                    key={col.code}
                    title={col.name}
                    className="py-3 px-2 border-r border-slate-800 text-center min-w-[70px]"
                  >
                    <div className="font-bold">{col.code}</div>
                    <div className="text-[9px] text-slate-400 font-normal">{col.credits} Cr</div>
                  </th>
                ))}
                <th className="py-3 px-3 border-r border-slate-800 text-center">Current Arr</th>
                <th className="py-3 px-3 border-r border-slate-800 text-center">Standing Arr</th>
                <th className="py-3 px-3 border-r border-slate-800 text-center">GPA</th>
                <th className="py-3 px-3 border-r border-slate-800 text-center">Result</th>
                <th className="py-3 px-3 text-center">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8 + (matrix?.columns.length || 0)} className="py-12 text-center text-slate-400">
                    Loading result matrix calculations...
                  </td>
                </tr>
              ) : filteredRows.length > 0 ? (
                filteredRows.map((row, idx) => (
                  <tr
                    key={row.student_id}
                    className={`hover:bg-slate-50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border-r border-slate-100">
                      {row.register_number}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 border-r border-slate-100">
                      {row.student_name}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-100">
                      {row.department_code}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-100">
                      {row.semester}
                    </td>

                    {/* Dynamic Grade Cells */}
                    {matrix?.columns.map((col) => {
                      const grade = row.grades[col.code] || '-';
                      const isArrear = ['RA', 'SA', 'AB', 'W'].includes(grade);
                      return (
                        <td
                          key={col.code}
                          className={`py-2.5 px-2 text-center font-bold border-r border-slate-100 ${
                            isArrear
                              ? 'bg-rose-50 text-rose-700'
                              : grade !== '-'
                              ? 'text-slate-800 font-semibold'
                              : 'text-slate-300'
                          }`}
                        >
                          {grade}
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-3 text-center font-bold border-r border-slate-100">
                      <span className={row.arrears_count > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {row.arrears_count}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold border-r border-slate-100">
                      <span className={row.standing_arrears_count > 0 ? 'text-amber-600' : 'text-slate-400'}>
                        {row.standing_arrears_count}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono text-blue-700 border-r border-slate-100">
                      {row.gpa.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-100">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.result_status === 'PASS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {row.result_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      ) : isStaff ? (
                        <button
                          onClick={() => handleVerify(row.student_id)}
                          disabled={verifyingId === row.student_id}
                          className="px-2 py-0.5 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-semibold border border-blue-200 cursor-pointer"
                        >
                          {verifyingId === row.student_id ? 'Verifying...' : 'Verify'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8 + (matrix?.columns.length || 0)} className="py-12 text-center text-slate-400">
                    No results found for the selected session and department.
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
