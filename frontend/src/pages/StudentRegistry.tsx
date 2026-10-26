import React, { useEffect, useState } from 'react';
import {
  Search,
  Upload,
  Plus,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import type { Student, Department } from '../types';

export const StudentRegistry: React.FC = () => {
  const { isStaff } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // New Student Form
  const [newStudent, setNewStudent] = useState({
    register_number: '',
    name: '',
    department_code: 'CSE',
    batch: '2022-2026',
    current_semester: 5,
    section: 'A',
    email: '',
  });
  const [addError, setAddError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      const data = await api.get<Department[]>('/students/departments');
      setDepartments(data);
    } catch {}
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search.trim()) params.append('search', search.trim());
      if (selectedDept) params.append('department_code', selectedDept);
      if (selectedBatch) params.append('batch', selectedBatch);
      if (selectedSemester) params.append('semester', selectedSemester.toString());

      const data = await api.get<{ items: Student[]; total: number; total_pages: number }>(
        `/students?${params.toString()}`
      );
      setStudents(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, selectedDept, selectedBatch, selectedSemester]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    try {
      await api.post('/students', newStudent);
      setIsAddModalOpen(false);
      setNewStudent({
        register_number: '',
        name: '',
        department_code: 'CSE',
        batch: '2022-2026',
        current_semester: 5,
        section: 'A',
        email: '',
      });
      fetchStudents();
    } catch (err: any) {
      setAddError(err.message || 'Failed to register student.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    setImportError(null);
    setImportSummary(null);

    try {
      const res = await api.upload('/students/import', formData);
      setImportSummary(res);
      fetchStudents();
    } catch (err: any) {
      setImportError(err.message || 'Error importing student roster file.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Registry & Cohort Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student records, batch cohorts, and bulk Excel/CSV roster enrollments.
          </p>
        </div>
        {isStaff && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setImportSummary(null);
                setImportError(null);
                setIsImportModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Import Roster</span>
            </button>
            <button
              onClick={() => {
                setAddError(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Register Number or Student Name..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>

          {/* Batch Filter */}
          <select
            value={selectedBatch}
            onChange={(e) => {
              setSelectedBatch(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Batches</option>
            <option value="2022-2026">2022-2026</option>
            <option value="2023-2027">2023-2027</option>
            <option value="2024-2028">2024-2028</option>
          </select>

          {/* Semester Filter */}
          <select
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
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

      {/* Student Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Register Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Batch</th>
                <th className="py-3 px-4 text-center">Semester</th>
                <th className="py-3 px-4 text-center">Section</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading student directory...
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.register_number}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{s.name}</td>
                    <td className="py-3 px-4 text-slate-600">{s.department_code}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{s.batch}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                        Sem {s.current_semester}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-bold">{s.section}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                        Enrolled
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No student records matched the specified filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing <span className="font-semibold text-slate-800">{students.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> total candidates
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Add Student Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Individual Student">
        {addError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{addError}</span>
          </div>
        )}
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Register Number (Unique)</label>
            <input
              type="text"
              required
              placeholder="e.g. 710022104021"
              value={newStudent.register_number}
              onChange={(e) => setNewStudent({ ...newStudent, register_number: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Student Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Vignesh R"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={newStudent.department_code}
                onChange={(e) => setNewStudent({ ...newStudent, department_code: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch</label>
              <input
                type="text"
                required
                value={newStudent.batch}
                onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Semester</label>
              <input
                type="number"
                min={1}
                max={8}
                required
                value={newStudent.current_semester}
                onChange={(e) => setNewStudent({ ...newStudent, current_semester: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                required
                value={newStudent.section}
                onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer"
            >
              Register Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Excel/CSV Import Modal */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Student Cohort Roster">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Upload an Excel (<code className="font-mono text-blue-600 font-bold">.xlsx</code>) or CSV file containing
            student records.
          </p>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            <span className="font-bold block mb-1">Required Columns:</span>
            <span>Register Number, Student Name, Department, Batch, Semester</span>
          </div>

          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all">
            <FileSpreadsheet className="w-8 h-8 text-blue-600 mb-2" />
            <span className="font-semibold text-slate-800">Click to Select Excel or CSV File</span>
            <span className="text-[10px] text-slate-400 mt-1">Automatic duplicate identification & data validation</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
            />
          </label>

          {importing && (
            <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-center gap-2 text-slate-700 font-medium">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Validating and registering records...</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSummary && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Roster Import Validation Report</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <span className="block text-[10px] text-emerald-600 font-medium">Imported</span>
                  <span className="font-bold text-emerald-800 text-sm">{importSummary.imported_count}</span>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <span className="block text-[10px] text-amber-600 font-medium">Duplicates</span>
                  <span className="font-bold text-amber-800 text-sm">{importSummary.duplicate_count}</span>
                </div>
                <div className="p-2 bg-rose-50 rounded-lg">
                  <span className="block text-[10px] text-rose-600 font-medium">Errors</span>
                  <span className="font-bold text-rose-800 text-sm">{importSummary.error_count}</span>
                </div>
              </div>
              {importSummary.errors && importSummary.errors.length > 0 && (
                <div className="mt-3 max-h-36 overflow-y-auto space-y-1 text-[11px] text-slate-600 border-t border-slate-200 pt-2">
                  {importSummary.errors.map((e: any, idx: number) => (
                    <div key={idx} className="text-rose-600">
                      Row {e.row} ({e.register_number || 'N/A'}): {e.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
