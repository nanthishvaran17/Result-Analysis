import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Award,
  BookOpen,
  Download,
  ShieldCheck,
  Percent,
  Users,
  Trophy,
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  GraduationCap,
  Filter,
  RotateCcw,
  X,
  FileText
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDossier } from '../context/DossierContext';
import { Modal } from '../components/Modal';
import { CustomDropdown, type DropdownOption } from '../components/CustomDropdown';
import { PdfViewerModal } from '../components/PdfViewerModal';
import type {
  ResultMatrix,
  Department,
  StudentMatrixRow,
  RankAndRemedialData,
  SubjectPerformanceData
} from '../types';

interface ResultAnalysisProps {
  activeSessionId: number | null;
  onNavigateTab: (tab: string) => void;
}

export const ResultAnalysis: React.FC<ResultAnalysisProps> = ({ activeSessionId, onNavigateTab }) => {
  const { isStaff } = useAuth();
  const { success, error: toastError, info } = useToast();
  const { openDossierByRegNo } = useDossier();

  const [matrix, setMatrix] = useState<ResultMatrix | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [selectedBatch, setSelectedBatch] = useState<string>('2022-2026');
  const [selectedSemester, setSelectedSemester] = useState<number | ''>(5);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // Sub-Views: Academic Matrix, Toppers & Remedial, Subject Pass %
  const [activeSubView, setActiveSubView] = useState<'matrix' | 'toppers_remedial' | 'subject_performance'>('matrix');
  const [toppersSubTab, setToppersSubTab] = useState<'toppers' | 'remedial'>('toppers');
  const [rankRemedialData, setRankRemedialData] = useState<RankAndRemedialData | null>(null);
  const [subjectPerfData, setSubjectPerfData] = useState<SubjectPerformanceData | null>(null);
  const [subViewLoading, setSubViewLoading] = useState(false);

  // Marksheet inspection modal
  const [inspectedRow, setInspectedRow] = useState<StudentMatrixRow | null>(null);

  const departmentOptions: DropdownOption[] = useMemo(() => [
    { value: '', label: 'All Departments', badge: 'ALL' },
    ...departments.map((d) => ({
      value: d.code,
      label: `${d.code} - ${d.name}`,
      badge: d.code,
      sublabel: d.name
    }))
  ], [departments]);

  const batchOptions: DropdownOption[] = [
    { value: '2022-2026', label: '2022-2026', badge: '22-26', sublabel: 'Final Year Cohort' },
    { value: '2023-2027', label: '2023-2027', badge: '23-27', sublabel: 'Third Year Cohort' },
    { value: '2024-2028', label: '2024-2028', badge: '24-28', sublabel: 'Second Year Cohort' },
    { value: '2025-2029', label: '2025-2029', badge: '25-29', sublabel: 'First Year Cohort' },
  ];

  const semesterOptions: DropdownOption[] = [
    { value: '', label: 'All Semesters', badge: 'ALL' },
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
      value: s,
      label: `Semester ${s}`,
      badge: `SEM ${s}`,
      sublabel: `Term ${s} Evaluation`
    }))
  ];

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

  const fetchRankRemedial = async () => {
    try {
      setSubViewLoading(true);
      const params = new URLSearchParams();
      if (activeSessionId) params.append('session_id', activeSessionId.toString());
      if (selectedDept) params.append('department_code', selectedDept);
      if (selectedBatch) params.append('batch', selectedBatch);
      if (selectedSemester) params.append('semester', selectedSemester.toString());

      const data = await api.get<RankAndRemedialData>(`/results/analytics/rank-and-remedial?${params.toString()}`);
      setRankRemedialData(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to load rank and remedial analytics.');
    } finally {
      setSubViewLoading(false);
    }
  };

  const fetchSubjectPerformance = async () => {
    try {
      setSubViewLoading(true);
      const params = new URLSearchParams();
      if (activeSessionId) params.append('session_id', activeSessionId.toString());
      if (selectedDept) params.append('department_code', selectedDept);
      if (selectedBatch) params.append('batch', selectedBatch);
      if (selectedSemester) params.append('semester', selectedSemester.toString());

      const data = await api.get<SubjectPerformanceData>(`/results/analytics/subject-performance?${params.toString()}`);
      setSubjectPerfData(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to load subject performance data.');
    } finally {
      setSubViewLoading(false);
    }
  };

  useEffect(() => {
    api.get<Department[]>('/students/departments').then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeSubView === 'matrix') {
      fetchMatrix();
    } else if (activeSubView === 'toppers_remedial') {
      fetchRankRemedial();
    } else if (activeSubView === 'subject_performance') {
      fetchSubjectPerformance();
    }
  }, [activeSessionId, selectedDept, selectedBatch, selectedSemester, activeSubView]);

  const handleVerify = async (resultId: number, studentRegNo: string) => {
    try {
      setVerifyingId(resultId);
      await api.post(`/results/${resultId}/verify`);
      success(`Marksheet for ${studentRegNo} digitally verified`);
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

  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');

  const handlePreviewPdf = (regNo: string) => {
    const token = localStorage.getItem('token');
    const sessCode = matrix?.session_code || rankRemedialData?.session_code || 'NOV_DEC_2025';
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
        setPreviewPdfUrl(url);
        setPreviewFileName(filename);
      })
      .catch((err) => toastError(err.message));
  };

  const handleDownloadPdf = (regNo: string) => {
    const token = localStorage.getItem('token');
    const sessCode = matrix?.session_code || rankRemedialData?.session_code || 'NOV_DEC_2025';
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

  // CSV Export Utilities
  const downloadToppersCsv = () => {
    if (!rankRemedialData || rankRemedialData.toppers.length === 0) {
      info('No rank holders data to export.');
      return;
    }
    const headers = ['Rank', 'Register Number', 'Student Name', 'Department', 'Batch', 'Semester', 'SGPA', 'Credits Earned'];
    const rows = rankRemedialData.toppers.map((t) => [
      t.rank,
      t.register_number,
      `"${t.student_name}"`,
      t.department_code,
      t.batch,
      t.semester,
      t.gpa.toFixed(2),
      t.earned_credits
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `toppers_rank_list_${selectedDept}_sem${selectedSemester || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    success('Toppers rank list downloaded successfully');
  };

  const downloadRemedialCsv = () => {
    if (!rankRemedialData || rankRemedialData.at_risk.length === 0) {
      info('No remedial candidates found to export.');
      return;
    }
    const headers = [
      'Register Number',
      'Student Name',
      'Department',
      'Batch',
      'Semester',
      'SGPA',
      'Current Arrears',
      'Standing Arrears',
      'Failed Subjects'
    ];
    const rows = rankRemedialData.at_risk.map((s) => [
      s.register_number,
      `"${s.student_name}"`,
      s.department_code,
      s.batch,
      s.semester,
      s.gpa.toFixed(2),
      s.arrears_count,
      s.standing_arrears_count,
      `"${s.failed_subjects.join(', ')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `remedial_coaching_list_${selectedDept}_sem${selectedSemester || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    success('Remedial coaching candidate list downloaded');
  };

  const downloadSubjectPerfCsv = () => {
    if (!subjectPerfData || subjectPerfData.subjects.length === 0) {
      info('No subject performance data to export.');
      return;
    }
    const headers = [
      'Subject Code',
      'Subject Title',
      'Credits',
      'Appeared',
      'Passed',
      'Failed (RA)',
      'Pass %',
      'Performance Category'
    ];
    const rows = subjectPerfData.subjects.map((sub) => [
      sub.subject_code,
      `"${sub.subject_name}"`,
      sub.credits,
      sub.appeared,
      sub.passed,
      sub.failed,
      sub.pass_percentage.toFixed(2),
      sub.performance_level
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subject_pass_percentage_${selectedDept}_sem${selectedSemester || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    success('Subject pass percentage report downloaded');
  };

  const filteredRows = matrix
    ? matrix.rows.filter(
        (r) =>
          r.register_number.toLowerCase().includes(search.toLowerCase()) ||
          r.student_name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const filteredToppers = rankRemedialData
    ? rankRemedialData.toppers.filter(
        (t) =>
          t.register_number.toLowerCase().includes(search.toLowerCase()) ||
          t.student_name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const filteredAtRisk = rankRemedialData
    ? rankRemedialData.at_risk.filter(
        (s) =>
          s.register_number.toLowerCase().includes(search.toLowerCase()) ||
          s.student_name.toLowerCase().includes(search.toLowerCase()) ||
          s.failed_subjects.some((sub) => sub.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const filteredSubjects = subjectPerfData
    ? subjectPerfData.subjects.filter(
        (s) =>
          s.subject_code.toLowerCase().includes(search.toLowerCase()) ||
          s.subject_name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Examination Ledger
              </span>
              <span className="text-slate-400 text-xs">
                Active Session: <strong className="text-white">{matrix?.session_code || rankRemedialData?.session_code || 'Loading...'}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Dynamic Result Analysis Matrix
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Student academic performance matrix, course credits, SGPA computation, arrear tracking, and faculty analytics.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Generate 5-Sheet Excel Workbook</span>
          </button>
        </div>
      </div>

      {/* Sub-View Navigation Switcher (Tabs) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveSubView('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubView === 'matrix'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Academic Matrix</span>
          </button>

          <button
            onClick={() => setActiveSubView('toppers_remedial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubView === 'toppers_remedial'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Toppers & Remedial Tracker</span>
          </button>

          <button
            onClick={() => setActiveSubView('subject_performance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubView === 'subject_performance'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Subject Pass % (HOD Analytics)</span>
          </button>
        </div>

        {/* View-Specific Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {activeSubView === 'matrix' && (
            <button
              onClick={() => onNavigateTab('reports')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full 5-Sheet Excel</span>
            </button>
          )}

          {activeSubView === 'toppers_remedial' && (
            <div className="flex items-center gap-2">
              <button
                onClick={downloadToppersCsv}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>Download Toppers CSV</span>
              </button>
              <button
                onClick={downloadRemedialCsv}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Export Remedial List (CSV)</span>
              </button>
            </div>
          )}

          {activeSubView === 'subject_performance' && (
            <button
              onClick={downloadSubjectPerfCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Export Subject Pass % (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* Executive Cohort Filter & Search Console */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              Cohort & Candidate Filter Console
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <span>Cohort:</span>
              <strong className="text-blue-700">{selectedDept || 'All Branches'}</strong>
              <span>•</span>
              <strong className="text-slate-800">{selectedBatch}</strong>
              <span>•</span>
              <strong className="text-indigo-700">{selectedSemester ? `Sem ${selectedSemester}` : 'All Semesters'}</strong>
            </span>
          </div>

          {(selectedDept !== 'CSE' || selectedBatch !== '2022-2026' || selectedSemester !== 5 || search) && (
            <button
              onClick={() => {
                setSelectedDept('CSE');
                setSelectedBatch('2022-2026');
                setSelectedSemester(5);
                setSearch('');
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Candidate / Course Live Search Input */}
          <div className="lg:col-span-5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Live Search Candidate / Course
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate name, register number (7100...), or course..."
                className="w-full pl-10 pr-9 h-10 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5 rounded-md hover:bg-slate-200/60 cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Department Custom Dropdown */}
          <div className="lg:col-span-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Academic Department
            </label>
            <CustomDropdown
              icon={Building2}
              options={departmentOptions}
              value={selectedDept}
              onChange={(val) => setSelectedDept(val)}
              minWidth="min-w-full"
              size="sm"
            />
          </div>

          {/* Academic Batch Custom Dropdown */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Batch Cohort
            </label>
            <CustomDropdown
              icon={Calendar}
              options={batchOptions}
              value={selectedBatch}
              onChange={(val) => setSelectedBatch(val)}
              minWidth="min-w-full"
              size="sm"
            />
          </div>

          {/* Semester Custom Dropdown */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Semester
            </label>
            <CustomDropdown
              icon={GraduationCap}
              options={semesterOptions}
              value={selectedSemester}
              onChange={(val) => setSelectedSemester(val)}
              minWidth="min-w-full"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: DYNAMIC ACADEMIC MATRIX */}
      {activeSubView === 'matrix' && (
        <>
          {/* Summary KPI Ribbon */}
          {matrix && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    Total Evaluated
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                  {matrix.total_students}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Active candidates in cohort</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">
                    All Cleared (Pass)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
                  {matrix.passed_students}
                </div>
                <span className="text-[11px] text-emerald-600/80 mt-1 block">Zero standing arrears</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-rose-600 font-bold uppercase tracking-wider">
                    Arrear Candidates
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-700 mt-2 font-mono">
                  {matrix.failed_students}
                </div>
                <span className="text-[11px] text-rose-600/80 mt-1 block">Requires re-appearance (RA)</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">
                    Overall Pass Rate
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-700 mt-2 font-mono">
                  {matrix.pass_percentage}%
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Avg GPA: <strong className="text-slate-700 font-mono">{matrix.average_gpa}</strong>
                </span>
              </div>
            </div>
          )}

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
                    {matrix?.columns.map((col) => (
                      <th
                        key={col.code}
                        title={col.name}
                        className="py-3.5 px-2 border-r border-slate-800 text-center min-w-[75px]"
                      >
                        <div className="font-bold text-blue-300">{col.code}</div>
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
                          <button
                            onClick={() => openDossierByRegNo(row.register_number)}
                            className="text-left font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                            title="Click to view Academic Dossier"
                          >
                            {row.register_number}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 border-r border-slate-100">
                          <button
                            onClick={() => openDossierByRegNo(row.register_number)}
                            className="text-left font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Click to view Academic Dossier"
                          >
                            {row.student_name}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-center text-slate-700 font-semibold border-r border-slate-100">
                          {row.department_code}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-700 border-r border-slate-100">
                          {row.semester}
                        </td>

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
                                ? 'px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200'
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
                                ? 'px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200'
                                : 'text-slate-400'
                            }
                          >
                            {row.standing_arrears_count}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono text-blue-700 border-r border-slate-100 text-sm">
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
                            <button
                              onClick={() => handlePreviewPdf(row.register_number)}
                              title="Preview Official Marksheet PDF"
                              className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-blue-200 shadow-2xs"
                            >
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>PDF</span>
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
                            No result records found for this cohort in the current session.
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
        </>
      )}

      {/* VIEW 2: TOPPERS & REMEDIAL TRACKER */}
      {activeSubView === 'toppers_remedial' && (
        <div className="space-y-6">
          {/* Sub-KPI Ribbon */}
          {rankRemedialData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Cohort Evaluated</span>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{rankRemedialData.total_appeared}</div>
                <span className="text-[11px] text-slate-400 mt-1 block">Candidates Appeared</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20">
                <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider block">Rank Holders (All Clear)</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">{rankRemedialData.total_passed}</div>
                <span className="text-[11px] text-emerald-600/80 mt-1 block">Zero Arrears</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm bg-rose-50/20">
                <span className="text-[11px] text-rose-700 font-bold uppercase tracking-wider block">Remedial Candidates</span>
                <div className="text-2xl font-bold text-rose-700 mt-1 font-mono">{rankRemedialData.total_at_risk}</div>
                <span className="text-[11px] text-rose-600/80 mt-1 block">Arrears &gt;= 1 or GPA &lt; 6.0</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm bg-blue-50/20">
                <span className="text-[11px] text-blue-700 font-bold uppercase tracking-wider block">Coaching Need Rate</span>
                <div className="text-2xl font-bold text-blue-700 mt-1 font-mono">
                  {rankRemedialData.total_appeared > 0
                    ? ((rankRemedialData.total_at_risk / rankRemedialData.total_appeared) * 100).toFixed(1)
                    : '0.0'}%
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Require Mentorship</span>
              </div>
            </div>
          )}

          {/* Toggle between Toppers and Remedial */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setToppersSubTab('toppers')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                toppersSubTab === 'toppers'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Toppers Leaderboard ({rankRemedialData?.toppers.length || 0})</span>
            </button>

            <button
              onClick={() => setToppersSubTab('remedial')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                toppersSubTab === 'remedial'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Remedial Coaching Candidates ({rankRemedialData?.at_risk.length || 0})</span>
            </button>
          </div>

          {/* TAB CONTENT: TOPPERS LEADERBOARD */}
          {toppersSubTab === 'toppers' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span>Academic Distinction & Rank Holders</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidates who cleared all subjects with 0 current and 0 standing arrears, sorted by SGPA.
                  </p>
                </div>
                <button
                  onClick={downloadToppersCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
                    <tr>
                      <th className="py-3 px-4 text-center w-20">Rank</th>
                      <th className="py-3 px-4">Register Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Department</th>
                      <th className="py-3 px-4 text-center">Batch</th>
                      <th className="py-3 px-4 text-center">Sem</th>
                      <th className="py-3 px-4 text-center">Credits</th>
                      <th className="py-3 px-4 text-center">SGPA</th>
                      <th className="py-3 px-4 text-center">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {subViewLoading ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <span>Evaluating academic merit...</span>
                        </td>
                      </tr>
                    ) : filteredToppers.length > 0 ? (
                      filteredToppers.map((t) => (
                        <tr key={t.student_id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                              t.rank === 1
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : t.rank === 2
                                ? 'bg-slate-200 text-slate-800 border border-slate-300'
                                : t.rank === 3
                                ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              Rank {t.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{t.register_number}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{t.student_name}</td>
                          <td className="py-3.5 px-4 text-center text-slate-700 font-semibold">{t.department_code}</td>
                          <td className="py-3.5 px-4 text-center text-slate-500">{t.batch}</td>
                          <td className="py-3.5 px-4 text-center text-slate-700 font-bold">{t.semester}</td>
                          <td className="py-3.5 px-4 text-center text-slate-600 font-mono">{t.earned_credits}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-base font-bold font-mono text-amber-700">
                              {t.gpa.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {t.gpa >= 8.5 ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                First Class with Distinction
                              </span>
                            ) : t.gpa >= 7.0 ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                First Class
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                Second Class
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          No rank holders found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: REMEDIAL COACHING CANDIDATES */}
          {toppersSubTab === 'remedial' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Class Advisor Remedial Action List</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Students requiring immediate counseling, re-tests, and faculty remedial coaching.
                  </p>
                </div>
                <button
                  onClick={downloadRemedialCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Remedial CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-4">Register Number</th>
                      <th className="py-3 px-4 min-w-[170px]">Student Name</th>
                      <th className="py-3 px-3 text-center">Branch</th>
                      <th className="py-3 px-3 text-center">Sem</th>
                      <th className="py-3 px-4">Failed Course Codes</th>
                      <th className="py-3 px-3 text-center">Current Arrears</th>
                      <th className="py-3 px-3 text-center">Standing Arrears</th>
                      <th className="py-3 px-3 text-center">SGPA</th>
                      <th className="py-3 px-4 text-center">Advisor Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {subViewLoading ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <span>Compiling remedial candidate roster...</span>
                        </td>
                      </tr>
                    ) : filteredAtRisk.length > 0 ? (
                      filteredAtRisk.map((s, idx) => (
                        <tr key={s.student_id} className="hover:bg-rose-50/30 transition-colors">
                          <td className="py-3.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{s.register_number}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{s.student_name}</td>
                          <td className="py-3.5 px-3 text-center text-slate-700 font-semibold">{s.department_code}</td>
                          <td className="py-3.5 px-3 text-center text-slate-700 font-bold">{s.semester}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {s.failed_subjects.length > 0 ? (
                                s.failed_subjects.map((code) => (
                                  <span
                                    key={code}
                                    className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold font-mono text-[11px] border border-rose-200"
                                  >
                                    {code}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-amber-600 font-medium">Low GPA (&lt; 6.0)</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold">
                            <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200 font-mono">
                              {s.arrears_count}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold">
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200 font-mono">
                              {s.standing_arrears_count}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                            {s.gpa.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => {
                                success(`Remedial counseling logged for ${s.student_name}`);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              Log Counseling
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <span className="text-sm font-bold text-slate-700">Outstanding Academic Record</span>
                          <p className="text-xs text-slate-400 mt-1">
                            No students with standing arrears or low GPAs found in this cohort.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: SUBJECT-WISE PASS % & HOD ANALYTICS */}
      {activeSubView === 'subject_performance' && (
        <div className="space-y-6">
          {/* HOD KPI Ribbon */}
          {subjectPerfData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Total Subjects</span>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {subjectPerfData.subjects.length}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">In Current Curriculum</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm bg-indigo-50/20">
                <span className="text-[11px] text-indigo-700 font-bold uppercase tracking-wider block">Overall Subject Pass %</span>
                <div className="text-2xl font-bold text-indigo-700 mt-1 font-mono">
                  {subjectPerfData.overall_pass_percentage}%
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Aggregate Across All Papers</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20">
                <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider block">High Performing (&gt;= 85%)</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
                  {subjectPerfData.subjects.filter((s) => s.performance_level === 'HIGH').length}
                </div>
                <span className="text-[11px] text-emerald-600/80 mt-1 block">Excellent Faculty Result</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm bg-rose-50/20">
                <span className="text-[11px] text-rose-700 font-bold uppercase tracking-wider block">Needs Focus (&lt; 70%)</span>
                <div className="text-2xl font-bold text-rose-700 mt-1 font-mono">
                  {subjectPerfData.subjects.filter((s) => s.performance_level === 'LOW').length}
                </div>
                <span className="text-[11px] text-rose-600/80 mt-1 block">Requires Review</span>
              </div>
            </div>
          )}

          {/* Visual Cards Grid for Each Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((sub) => (
              <div
                key={sub.subject_code}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-blue-300 font-bold font-mono text-xs">
                      {sub.subject_code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        sub.performance_level === 'HIGH'
                          ? 'bg-emerald-100 text-emerald-700'
                          : sub.performance_level === 'AVERAGE'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {sub.performance_level === 'HIGH' ? 'High Pass' : sub.performance_level === 'AVERAGE' ? 'Average' : 'Low Pass'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1" title={sub.subject_name}>
                    {sub.subject_name}
                  </h4>
                  <span className="text-[11px] text-slate-400 block font-medium">Credits: {sub.credits}</span>

                  {/* Pass Percentage Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 font-semibold">Pass Rate</span>
                      <span className="font-bold font-mono text-slate-900 text-sm">
                        {sub.pass_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sub.pass_percentage >= 85
                            ? 'bg-emerald-500'
                            : sub.pass_percentage >= 70
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${sub.pass_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Appeared / Passed / Failed counts */}
                  <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Appeared</span>
                      <strong className="text-slate-800 font-mono text-xs">{sub.appeared}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-600 block font-bold">Passed</span>
                      <strong className="text-emerald-700 font-mono text-xs">{sub.passed}</strong>
                    </div>
                    <div>
                      <span className="text-rose-600 block font-bold">Failed</span>
                      <strong className="text-rose-700 font-mono text-xs">{sub.failed}</strong>
                    </div>
                  </div>
                </div>

                {/* Grade Distribution Micro-Pills */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                    Grade Distribution
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(sub.grades_count)
                      .filter(([_, count]) => count > 0)
                      .map(([grade, count]) => (
                        <span
                          key={grade}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            ['RA', 'SA', 'AB', 'W'].includes(grade)
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : ['O', 'A+'].includes(grade)
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {grade}: {count}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comprehensive Analytical Table for Subject Pass % */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Subject-Wise Pass Percentage & Grade Matrix (HOD Review)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete breakdown of candidate evaluation per course paper for curriculum and faculty audit.
                </p>
              </div>
              <button
                onClick={downloadSubjectPerfCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
                  <tr>
                    <th className="py-3 px-4">Subject Code</th>
                    <th className="py-3 px-4 min-w-[200px]">Subject Name</th>
                    <th className="py-3 px-3 text-center">Credits</th>
                    <th className="py-3 px-3 text-center">Appeared</th>
                    <th className="py-3 px-3 text-center text-emerald-300">Passed</th>
                    <th className="py-3 px-3 text-center text-rose-300">Failed (RA)</th>
                    <th className="py-3 px-4 text-center">Pass %</th>
                    <th className="py-3 px-4 text-center">Performance Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {subViewLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span>Calculating subject statistics...</span>
                      </td>
                    </tr>
                  ) : filteredSubjects.length > 0 ? (
                    filteredSubjects.map((sub) => (
                      <tr key={sub.subject_code} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{sub.subject_code}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{sub.subject_name}</td>
                        <td className="py-3.5 px-3 text-center text-slate-600 font-bold">{sub.credits}</td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-mono font-bold">{sub.appeared}</td>
                        <td className="py-3.5 px-3 text-center text-emerald-700 font-mono font-bold bg-emerald-50/40">
                          {sub.passed}
                        </td>
                        <td className="py-3.5 px-3 text-center text-rose-700 font-mono font-bold bg-rose-50/40">
                          {sub.failed}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-sm">
                          <span
                            className={
                              sub.pass_percentage >= 85
                                ? 'text-emerald-600'
                                : sub.pass_percentage >= 70
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }
                          >
                            {sub.pass_percentage.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              sub.performance_level === 'HIGH'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sub.performance_level === 'AVERAGE'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {sub.performance_level}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No subject evaluation data available for this cohort.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Student Marksheet Detailed Inspection Modal */}
      <Modal
        isOpen={Boolean(inspectedRow)}
        onClose={() => setInspectedRow(null)}
        title={`Candidate Marksheet Inspection: ${inspectedRow?.register_number}`}
        subtitle={inspectedRow ? `${inspectedRow.student_name}  •  Department: ${inspectedRow.department_code}  •  Semester ${inspectedRow.semester}` : ''}
        icon={<Award className="w-5 h-5 text-blue-600" />}
        maxWidth="max-w-4xl"
      >
        {inspectedRow && (
          <div className="space-y-5 text-xs">
            {/* Quick KPI Strip with Pixel-Perfect Alignment */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col items-center justify-center py-3.5 px-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mb-1">
                  SGPA
                </span>
                <span className="h-8 flex items-center justify-center text-2xl font-black text-blue-600 font-mono">
                  {inspectedRow.gpa.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-3.5 px-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mb-1">
                  Current Arrears
                </span>
                <span className={`h-8 flex items-center justify-center text-2xl font-black font-mono ${
                  inspectedRow.arrears_count > 0 ? 'text-rose-600' : 'text-slate-800'
                }`}>
                  {inspectedRow.arrears_count}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-3.5 px-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mb-1">
                  Standing Arrears
                </span>
                <span className={`h-8 flex items-center justify-center text-2xl font-black font-mono ${
                  inspectedRow.standing_arrears_count > 0 ? 'text-amber-600' : 'text-slate-800'
                }`}>
                  {inspectedRow.standing_arrears_count}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-3.5 px-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mb-1">
                  Final Result
                </span>
                <div className="h-8 flex items-center justify-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-2xs ${
                    inspectedRow.result_status === 'PASS'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {inspectedRow.result_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Courses Breakdown Table with Balanced Column Proportions */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-3 px-4 w-32 font-bold text-[11px] uppercase tracking-wider">
                      Course Code
                    </th>
                    <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="py-3 px-4 w-24 text-center font-bold text-[11px] uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="py-3 px-4 w-28 text-center font-bold text-[11px] uppercase tracking-wider">
                      Letter Grade
                    </th>
                    <th className="py-3 px-4 w-28 text-center font-bold text-[11px] uppercase tracking-wider">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {matrix?.columns.map((col) => {
                    const grade = inspectedRow.grades[col.code] || '-';
                    const isArrear = ['RA', 'SA', 'AB', 'W', 'U'].includes(grade);
                    const isHigh = ['O', 'A+'].includes(grade);
                    return (
                      <tr key={col.code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {col.code}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">
                          {col.name}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                          {col.credits}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {grade === '-' ? (
                            <span className="text-slate-300 font-mono">-</span>
                          ) : isArrear ? (
                            <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-lg font-bold font-mono text-xs bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                              {grade}
                            </span>
                          ) : isHigh ? (
                            <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-lg font-bold font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                              {grade}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-lg font-semibold font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200">
                              {grade}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {grade === '-' ? (
                            <span className="text-slate-300 font-mono">-</span>
                          ) : isArrear ? (
                            <span className="inline-flex items-center justify-center min-w-[56px] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                              FAIL
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center min-w-[56px] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              PASS
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Actions - Aligned with Uniform Button Heights */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {inspectedRow.is_verified ? (
                  <span className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Digitally Authenticated Marksheet</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleVerify(inspectedRow.student_id, inspectedRow.register_number)}
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Authenticate Marksheet</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handlePreviewPdf(inspectedRow.register_number)}
                  className="h-9 flex items-center gap-1.5 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold border border-blue-200 transition-all cursor-pointer text-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Preview PDF</span>
                </button>
                <button
                  onClick={() => handleDownloadPdf(inspectedRow.register_number)}
                  className="h-9 flex items-center gap-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download Official PDF</span>
                </button>
                <button
                  onClick={() => setInspectedRow(null)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 font-bold transition-colors cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Official Marksheet PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={!!previewPdfUrl}
        onClose={() => setPreviewPdfUrl(null)}
        pdfUrl={previewPdfUrl}
        fileName={previewFileName}
      />
    </div>
  );
};

