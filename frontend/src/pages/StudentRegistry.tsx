import React, { useEffect, useState } from 'react';
import {
  Search,
  Upload,
  Plus,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  Copy,
  Table,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  UserCheck,
  Building2,
  Calendar,
  GraduationCap,
  Filter,
  X
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDossier } from '../context/DossierContext';
import { Modal } from '../components/Modal';
import { CustomDropdown, type DropdownOption } from '../components/CustomDropdown';
import type { Student, Department } from '../types';

interface SpreadsheetRow {
  id: string;
  register_number: string;
  name: string;
  department_code: string;
  batch: string;
  current_semester: number;
  section: string;
  email: string;
  hasChanged?: boolean;
}

export const StudentRegistry: React.FC = () => {
  const { isStaff, isAdmin } = useAuth();
  const { success, error: toastError, info } = useToast();
  const { openDossier } = useDossier();

  const [viewMode, setViewMode] = useState<'directory' | 'spreadsheet'>('directory');
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

  const departmentOptions: DropdownOption[] = [
    { value: '', label: 'All Departments', badge: 'ALL' },
    ...departments.map((d) => ({
      value: d.code,
      label: `${d.code} - ${d.name}`,
      badge: d.code,
      sublabel: d.name
    }))
  ];

  const batchOptions: DropdownOption[] = [
    { value: '', label: 'All Batches', badge: 'ALL' },
    { value: '2022-2026', label: 'Batch 2022-2026', badge: '22-26' },
    { value: '2023-2027', label: 'Batch 2023-2027', badge: '23-27' },
    { value: '2024-2028', label: 'Batch 2024-2028', badge: '24-28' },
    { value: '2025-2029', label: 'Batch 2025-2029', badge: '25-29' },
  ];

  const semesterOptions: DropdownOption[] = [
    { value: '', label: 'All Semesters', badge: 'ALL' },
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
      value: s,
      label: `Semester ${s}`,
      badge: `SEM ${s}`
    }))
  ];

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Single Student Form
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

  // Live Excel Spreadsheet Rows (Smart entry mode)
  const [spreadsheetRows, setSpreadsheetRows] = useState<SpreadsheetRow[]>([
    {
      id: 'row-1',
      register_number: '',
      name: '',
      department_code: 'CSE',
      batch: '2022-2026',
      current_semester: 5,
      section: 'A',
      email: '',
    },
  ]);
  const [isSavingSpreadsheet, setIsSavingSpreadsheet] = useState(false);

  const fetchDepartments = async () => {
    try {
      const data = await api.get<Department[]>('/students/departments');
      setDepartments(data);
    } catch { }
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
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch student registry.');
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
      success(`Student ${newStudent.register_number} registered successfully!`);
      setNewStudent({
        register_number: '',
        name: '',
        department_code: departments[0]?.code || 'CSE',
        batch: '2022-2026',
        current_semester: 5,
        section: 'A',
        email: '',
      });
      fetchStudents();
    } catch (err: any) {
      setAddError(err.message || 'Failed to register student.');
      toastError(err.message || 'Registration failed.');
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await api.put(`/students/${editingStudent.id}`, {
        name: editingStudent.name,
        department_code: editingStudent.department_code,
        batch: editingStudent.batch,
        current_semester: editingStudent.current_semester,
        section: editingStudent.section,
        email: editingStudent.email,
      });
      setIsEditModalOpen(false);
      setEditingStudent(null);
      success(`Updated record for ${editingStudent.register_number}`);
      fetchStudents();
    } catch (err: any) {
      toastError(err.message || 'Failed to update student.');
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await api.delete(`/students/${studentToDelete.id}`);
      success(`Student ${studentToDelete.register_number} deleted successfully.`);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete student.');
    }
  };

  const handleDownloadTemplate = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/students/template', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Official_Student_Roster_Template.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        success('Downloaded Official Student Roster Excel Template (.xlsx)!');
      })
      .catch((err) => toastError(err.message));
  };

  const handleExportRoster = () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (selectedDept) params.append('department_code', selectedDept);
    if (selectedBatch) params.append('batch', selectedBatch);
    if (selectedSemester) params.append('semester', selectedSemester.toString());

    fetch(`/api/v1/students/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Student_Roster_${selectedDept || 'ALL'}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        success('Exported current student cohort to Excel workbook!');
      })
      .catch((err) => toastError(err.message));
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
      const res = await api.upload<any>('/students/import', formData);
      setImportSummary(res);
      success(`Imported ${res.imported_count} records successfully!`);
      fetchStudents();
    } catch (err: any) {
      setImportError(err.message || 'Error importing student roster file.');
      toastError(err.message || 'File import failed.');
    } finally {
      setImporting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    info(`Copied ${text} to clipboard!`);
  };

  // --- SMART EXCEL SPREADSHEET ROW MANAGEMENT ---
  // Ensure that as soon as user enters/types data in the last row, a new blank row is automatically added!
  const handleSpreadsheetCellChange = (
    rowIndex: number,
    field: keyof Omit<SpreadsheetRow, 'id' | 'hasChanged'>,
    value: any
  ) => {
    setSpreadsheetRows((prev) => {
      const updated = [...prev];
      const currentRow = { ...updated[rowIndex], [field]: value, hasChanged: true };

      // Auto-generate email if reg_no provided and email is blank/default
      if (field === 'register_number' && value && (!currentRow.email || currentRow.email.includes('@college.edu'))) {
        currentRow.email = `${value.trim().toLowerCase()}@college.edu`;
      }

      updated[rowIndex] = currentRow;

      // "only user enter panra time new row ensure panni kudu"
      // If the user modified the very last row and it contains any data, automatically ensure a brand new empty row is appended!
      if (rowIndex === updated.length - 1) {
        const hasContent = Boolean(
          currentRow.register_number.trim() || currentRow.name.trim()
        );
        if (hasContent) {
          const defaultDept = departments[0]?.code || 'CSE';
          updated.push({
            id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            register_number: '',
            name: '',
            department_code: currentRow.department_code || defaultDept,
            batch: currentRow.batch || '2022-2026',
            current_semester: currentRow.current_semester || 5,
            section: currentRow.section || 'A',
            email: '',
          });
        }
      }

      return updated;
    });
  };

  const addSpreadsheetRowManual = () => {
    const lastRow = spreadsheetRows[spreadsheetRows.length - 1];
    setSpreadsheetRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        register_number: '',
        name: '',
        department_code: lastRow?.department_code || departments[0]?.code || 'CSE',
        batch: lastRow?.batch || '2022-2026',
        current_semester: lastRow?.current_semester || 5,
        section: lastRow?.section || 'A',
        email: '',
      },
    ]);
  };

  const removeSpreadsheetRow = (index: number) => {
    if (spreadsheetRows.length <= 1) {
      // Just clear the single row
      setSpreadsheetRows([
        {
          id: `row-${Date.now()}`,
          register_number: '',
          name: '',
          department_code: departments[0]?.code || 'CSE',
          batch: '2022-2026',
          current_semester: 5,
          section: 'A',
          email: '',
        },
      ]);
      return;
    }
    setSpreadsheetRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveSpreadsheet = async () => {
    // Filter only rows that have register_number and name
    const validRows = spreadsheetRows.filter(
      (r) => r.register_number.trim() !== '' && r.name.trim() !== ''
    );

    if (validRows.length === 0) {
      toastError('Please fill at least one student Register Number and Name before saving.');
      return;
    }

    setIsSavingSpreadsheet(true);
    try {
      const payload = validRows.map((r) => ({
        register_number: r.register_number.trim().toUpperCase(),
        name: r.name.trim(),
        department_code: r.department_code.trim().toUpperCase(),
        batch: r.batch.trim(),
        current_semester: Number(r.current_semester),
        section: r.section.trim().toUpperCase(),
        email: r.email.trim() || `${r.register_number.trim().toLowerCase()}@college.edu`,
      }));

      const res = await api.post<any>('/students/bulk', payload);
      success(
        `Successfully saved ${res.created_count} student record(s)!${res.skipped_count > 0 ? ` (${res.skipped_count} skipped as duplicates)` : ''
        }`
      );

      // Reset spreadsheet to one clean row
      setSpreadsheetRows([
        {
          id: `row-${Date.now()}`,
          register_number: '',
          name: '',
          department_code: departments[0]?.code || 'CSE',
          batch: '2022-2026',
          current_semester: 5,
          section: 'A',
          email: '',
        },
      ]);
      fetchStudents();
      setViewMode('directory');
    } catch (err: any) {
      toastError(err.message || 'Failed to save spreadsheet rows.');
    } finally {
      setIsSavingSpreadsheet(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Institutional Directory
              </span>
              <span className="text-slate-400 text-xs">• Total Enrolled: <strong className="text-white">{total}</strong> Candidates</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight font-heading text-white">
              Student Registry & Cohort Directory
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time student registry, interactive Excel-style live spreadsheet entry, official roster imports, and cohort verification.
            </p>
          </div>

          {/* Action Button Ribbon */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Segmented Switch */}
            <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 flex items-center shadow-inner">
              <button
                onClick={() => setViewMode('directory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'directory'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Directory</span>
              </button>
              <button
                onClick={() => setViewMode('spreadsheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'spreadsheet'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Smart Excel Entry</span>
              </button>
            </div>

            {/* Excel Template & Export */}
            <button
              onClick={handleDownloadTemplate}
              title="Download standard roster Excel template"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Template</span>
            </button>

            <button
              onClick={handleExportRoster}
              title="Export current cohort to Excel (.xlsx)"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export</span>
            </button>

            {isStaff && (
              <>
                <button
                  onClick={() => {
                    setImportSummary(null);
                    setImportError(null);
                    setIsImportModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Import Excel</span>
                </button>
                <button
                  onClick={() => {
                    setAddError(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer hover:-translate-y-0.5 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Single</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- SMART SPREADSHEET VIEW ("only user enter panra time new row ensure panni kudu") --- */}
      {viewMode === 'spreadsheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-slide-down">
          {/* Spreadsheet Header Banner */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm tracking-tight text-white font-heading">
                  Live Smart Excel Entry Grid
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dynamic Row Insertion
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Enter details below. As you enter or type in the last row, a brand new row is <strong>automatically ensured and appended</strong> below!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={addSpreadsheetRowManual}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Insert Row</span>
              </button>
              <button
                onClick={() =>
                  setSpreadsheetRows([
                    {
                      id: `row-${Date.now()}`,
                      register_number: '',
                      name: '',
                      department_code: departments[0]?.code || 'CSE',
                      batch: '2022-2026',
                      current_semester: 5,
                      section: 'A',
                      email: '',
                    },
                  ])
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleSaveSpreadsheet}
                disabled={isSavingSpreadsheet}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isSavingSpreadsheet ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save All Records</span>
              </button>
            </div>
          </div>

          {/* Interactive Spreadsheet Grid */}
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 text-center text-slate-400">#</th>
                  <th className="py-3 px-3 w-44">Register Number *</th>
                  <th className="py-3 px-3 w-56">Student Full Name *</th>
                  <th className="py-3 px-3 w-32">Department</th>
                  <th className="py-3 px-3 w-32">Batch</th>
                  <th className="py-3 px-3 w-28 text-center">Semester</th>
                  <th className="py-3 px-3 w-24 text-center">Section</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {spreadsheetRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                  >
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Register Number */}
                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="e.g. 710022104030"
                        value={row.register_number}
                        onChange={(e) =>
                          handleSpreadsheetCellChange(idx, 'register_number', e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                      />
                    </td>

                    {/* Name */}
                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Koushik S"
                        value={row.name}
                        onChange={(e) => handleSpreadsheetCellChange(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                      />
                    </td>

                    {/* Department */}
                    <td className="p-1.5">
                      <select
                        value={row.department_code}
                        onChange={(e) =>
                          handleSpreadsheetCellChange(idx, 'department_code', e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden cursor-pointer"
                      >
                        {departments.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.code}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Batch */}
                    <td className="p-1.5">
                      <select
                        value={row.batch}
                        onChange={(e) => handleSpreadsheetCellChange(idx, 'batch', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden cursor-pointer"
                      >
                        <option value="2022-2026">2022-2026</option>
                        <option value="2023-2027">2023-2027</option>
                        <option value="2024-2028">2024-2028</option>
                        <option value="2025-2029">2025-2029</option>
                      </select>
                    </td>

                    {/* Semester */}
                    <td className="p-1.5 text-center">
                      <select
                        value={row.current_semester}
                        onChange={(e) =>
                          handleSpreadsheetCellChange(idx, 'current_semester', Number(e.target.value))
                        }
                        className="w-full px-2 py-1.5 text-xs font-bold text-center bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Section */}
                    <td className="p-1.5 text-center">
                      <select
                        value={row.section}
                        onChange={(e) => handleSpreadsheetCellChange(idx, 'section', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-bold text-center bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden cursor-pointer"
                      >
                        {['A', 'B', 'C', 'D'].map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Email */}
                    <td className="p-1.5">
                      <input
                        type="email"
                        placeholder="e.g. reg@college.edu"
                        value={row.email}
                        onChange={(e) => handleSpreadsheetCellChange(idx, 'email', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                      />
                    </td>

                    {/* Action */}
                    <td className="p-1.5 text-center">
                      <button
                        onClick={() => removeSpreadsheetRow(idx)}
                        title="Remove Row"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              <span>Rows ready: </span>
              <strong className="text-slate-800">
                {spreadsheetRows.filter((r) => r.register_number.trim() && r.name.trim()).length}
              </strong>{' '}
              of <span className="text-slate-800">{spreadsheetRows.length} total rows</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-creates a new row when typing in the last row</span>
              </span>
              <button
                onClick={handleSaveSpreadsheet}
                disabled={isSavingSpreadsheet}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                Save All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STANDARD DIRECTORY TABLE VIEW --- */}
      {viewMode === 'directory' && (
        <div className="space-y-4">
          {/* Executive Cohort Filter & Search Console */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Filter className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Cohort & Student Directory Filter
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <span>Filtered:</span>
                  <strong className="text-blue-700">{selectedDept || 'All Departments'}</strong>
                  <span>•</span>
                  <strong className="text-slate-800">{selectedBatch || 'All Batches'}</strong>
                  <span>•</span>
                  <strong className="text-indigo-700">{selectedSemester ? `Sem ${selectedSemester}` : 'All Semesters'}</strong>
                </span>
              </div>

              {(selectedDept || selectedBatch || selectedSemester || search) && (
                <button
                  onClick={() => {
                    setSelectedDept('');
                    setSelectedBatch('');
                    setSelectedSemester('');
                    setSearch('');
                    setPage(1);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Search Form */}
              <div className="lg:col-span-5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Live Search Candidate / Register No
                </label>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search register number or candidate name..."
                    className="w-full pl-10 pr-9 h-10 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium transition-all"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setPage(1);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5 rounded-md hover:bg-slate-200/60 cursor-pointer"
                      title="Clear Search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
              </div>

              {/* Department Dropdown */}
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <CustomDropdown
                  icon={Building2}
                  options={departmentOptions}
                  value={selectedDept}
                  onChange={(val) => {
                    setSelectedDept(val);
                    setPage(1);
                  }}
                  minWidth="min-w-full"
                  size="sm"
                />
              </div>

              {/* Batch Dropdown */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Batch
                </label>
                <CustomDropdown
                  icon={Calendar}
                  options={batchOptions}
                  value={selectedBatch}
                  onChange={(val) => {
                    setSelectedBatch(val);
                    setPage(1);
                  }}
                  minWidth="min-w-full"
                  size="sm"
                />
              </div>

              {/* Semester Dropdown */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Semester
                </label>
                <CustomDropdown
                  icon={GraduationCap}
                  options={semesterOptions}
                  value={selectedSemester}
                  onChange={(val) => {
                    setSelectedSemester(val);
                    setPage(1);
                  }}
                  minWidth="min-w-full"
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Student Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold tracking-wider uppercase text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Register Number</th>
                    <th className="py-3.5 px-4">Candidate Full Name</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4 text-center">Batch</th>
                    <th className="py-3.5 px-4 text-center">Semester</th>
                    <th className="py-3.5 px-4 text-center">Section</th>
                    <th className="py-3.5 px-4 text-center">Enrollment Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-semibold text-slate-600">Loading student directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : students.length > 0 ? (
                    students.map((s, idx) => (
                      <tr
                        key={s.id}
                        className={`hover:bg-blue-50/40 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openDossier(s)}
                              className="text-left font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                              title="Click to view 360° Academic Dossier"
                            >
                              {s.register_number}
                            </button>
                            <button
                              onClick={() => copyToClipboard(s.register_number)}
                              title="Copy Register Number"
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity p-0.5"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-bold">
                          <button
                            onClick={() => openDossier(s)}
                            className="text-left font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Click to view 360° Academic Dossier"
                          >
                            {s.name}
                          </button>
                          {s.email && <div className="text-[10px] text-slate-400 font-normal font-mono">{s.email}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100">
                            {s.department_code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-700 font-semibold">{s.batch}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-800 text-[11px]">
                            Sem {s.current_semester}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{s.section}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Enrolled</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openDossier(s)}
                              title="View Academic Dossier"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStudent(s);
                                setIsEditModalOpen(true);
                              }}
                              title="Edit Student"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setStudentToDelete(s)}
                                title="Delete Student"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <AlertCircle className="w-8 h-8 text-slate-300" />
                          <h4 className="text-sm font-bold text-slate-700">No Student Records Found</h4>
                          <p className="text-xs text-slate-400">
                            No students match your filter criteria. Switch to "Smart Excel Entry" or click "Add Single" to register candidates.
                          </p>
                          <button
                            onClick={() => setViewMode('spreadsheet')}
                            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Open Smart Excel Entry
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/60">
              <div>
                Showing <strong className="text-slate-800">{students.length}</strong> of{' '}
                <strong className="text-slate-800">{total}</strong> registered candidates
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="font-bold text-slate-700 px-2">
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Single Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Individual Student"
        subtitle="Add a single student candidate directly to the active institutional registry."
        icon={<UserCheck className="w-5 h-5 text-blue-600" />}
      >
        {addError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{addError}</span>
          </div>
        )}
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Register Number (Unique) *</label>
            <input
              type="text"
              required
              placeholder="e.g. 710022104021"
              value={newStudent.register_number}
              onChange={(e) => setNewStudent({ ...newStudent, register_number: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Student Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Vignesh R"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden font-semibold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={newStudent.department_code}
                onChange={(e) => setNewStudent({ ...newStudent, department_code: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-white font-semibold"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Batch</label>
              <select
                value={newStudent.batch}
                onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-white font-semibold"
              >
                <option value="2022-2026">2022-2026</option>
                <option value="2023-2027">2023-2027</option>
                <option value="2024-2028">2024-2028</option>
                <option value="2025-2029">2025-2029</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Semester</label>
              <select
                value={newStudent.current_semester}
                onChange={(e) => setNewStudent({ ...newStudent, current_semester: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-white font-semibold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                required
                value={newStudent.section}
                onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="e.g. 710022104021@college.edu"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden font-mono"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md cursor-pointer"
            >
              Register Candidate
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen && Boolean(editingStudent)}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
        }}
        title={`Edit Student: ${editingStudent?.register_number}`}
        subtitle="Update registered profile and cohort assignment."
        icon={<Edit2 className="w-5 h-5 text-indigo-600" />}
      >
        {editingStudent && (
          <form onSubmit={handleUpdateStudent} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Register Number (Read-Only)</label>
              <input
                type="text"
                disabled
                value={editingStudent.register_number}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Student Full Name</label>
              <input
                type="text"
                required
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={editingStudent.department_code}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, department_code: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold bg-white"
                >
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Batch</label>
                <input
                  type="text"
                  required
                  value={editingStudent.batch}
                  onChange={(e) => setEditingStudent({ ...editingStudent, batch: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Semester</label>
                <select
                  value={editingStudent.current_semester}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, current_semester: Number(e.target.value) })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Section</label>
                <input
                  type="text"
                  required
                  value={editingStudent.section}
                  onChange={(e) => setEditingStudent({ ...editingStudent, section: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={editingStudent.email || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingStudent(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        title="Confirm Student Removal"
        subtitle="This action removes the student and associated academic session marksheets."
        icon={<Trash2 className="w-5 h-5 text-rose-600" />}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete student candidate{' '}
            <strong className="text-slate-900 font-mono font-bold">{studentToDelete?.register_number}</strong> (
            {studentToDelete?.name})?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setStudentToDelete(null)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStudent}
              className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md cursor-pointer"
            >
              Delete Record
            </button>
          </div>
        </div>
      </Modal>

      {/* Excel/CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Student Cohort Roster"
        subtitle="Bulk upload student cohorts via standard Microsoft Excel (.xlsx) or CSV files."
        icon={<FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-xl text-blue-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Required Excel Columns</span>
              </span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-[11px] text-blue-700 underline font-bold hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample .xlsx</span>
              </button>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Column headers can be: <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">Register Number</code>,{' '}
              <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">Student Name</code>,{' '}
              <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">Department</code>,{' '}
              <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">Batch</code>,{' '}
              <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">Semester</code>.
            </p>
          </div>

          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-600 mb-3 transition-colors shadow-2xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 text-sm">Click to Select Excel or CSV File</span>
            <span className="text-[11px] text-slate-400 mt-1 font-medium">Supports .xlsx, .xls, and .csv formats</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
            />
          </label>

          {importing && (
            <div className="p-3.5 bg-slate-100 rounded-xl flex items-center justify-center gap-2 text-slate-700 font-semibold">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Validating and persisting roster records...</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSummary && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Roster Import Summary Report</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="block text-[10px] text-emerald-600 font-bold uppercase">Imported</span>
                  <span className="font-extrabold text-emerald-800 text-base">{importSummary.imported_count}</span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="block text-[10px] text-amber-600 font-bold uppercase">Duplicates</span>
                  <span className="font-extrabold text-amber-800 text-base">{importSummary.duplicate_count}</span>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="block text-[10px] text-rose-600 font-bold uppercase">Errors</span>
                  <span className="font-extrabold text-rose-800 text-base">{importSummary.error_count}</span>
                </div>
              </div>
              {importSummary.errors && importSummary.errors.length > 0 && (
                <div className="mt-2 max-h-36 overflow-y-auto space-y-1 text-[11px] text-slate-600 border-t border-slate-200 pt-2 font-mono">
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
