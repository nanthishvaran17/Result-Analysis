import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  AlertCircle,
  Terminal,
  ShieldCheck,
  FileCheck,
  Cpu,
  Building2,
  Calendar,
  GraduationCap,
  Clock,
  Globe,
  Download,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  Upload,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CustomDropdown } from '../components/CustomDropdown';
import { PdfViewerModal } from '../components/PdfViewerModal';
import type { ExamSession, Department, AutomationJob } from '../types';

interface ResultAutomationCenterProps {
  activeSessionId: number | null;
}

export const ResultAutomationCenter: React.FC<ResultAutomationCenterProps> = ({ activeSessionId }) => {
  const { isStaff } = useAuth();
  const { success, error: toastError, info, warning } = useToast();

  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | ''>(activeSessionId || '');
  const [selectedDept, setSelectedDept] = useState<string>('CSE-CS');
  const [selectedBatch, setSelectedBatch] = useState<string>('2022-2026');
  const [selectedSemester, setSelectedSemester] = useState<number>(6);

  // Live Nandha COE Portal State
  const [liveRegNo, setLiveRegNo] = useState('732224CC031');
  const [liveDob, setLiveDob] = useState('01/06/2007');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveResult, setLiveResult] = useState<any>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');

  // Dual Mode: Single vs Bulk Sheet Gateway
  const [liveGatewayMode, setLiveGatewayMode] = useState<'single' | 'bulk'>('single');
  const [bulkRows, setBulkRows] = useState<Array<{ id: string; register_number: string; dob: string; name: string }>>([
    { id: '1', register_number: '732224CC031', dob: '01/06/2007', name: 'NANTHISH  S' },
    { id: '2', register_number: '', dob: '', name: '' }
  ]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkReport, setBulkReport] = useState<any | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeJob, setActiveJob] = useState<AutomationJob | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);

  const fetchData = async () => {
    try {
      const [sessData, deptData, jobsData] = await Promise.all([
        api.get<ExamSession[]>('/sessions'),
        api.get<Department[]>('/students/departments'),
        api.get<AutomationJob[]>('/automation/jobs?limit=1'),
      ]);
      setSessions(sessData);
      setDepartments(deptData);
      if (jobsData.length > 0) {
        loadJobDetails(jobsData[0].id);
      }
    } catch {}
  };

  const loadJobDetails = async (jobId: string) => {
    try {
      const job = await api.get<AutomationJob>(`/automation/jobs/${jobId}`);
      setActiveJob(job);
      return job;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      setSelectedSession(activeSessionId);
    }
  }, [activeSessionId]);

  // Polling while active job is running or paused
  useEffect(() => {
    if (activeJob && (activeJob.status === 'RUNNING' || activeJob.status === 'PAUSED')) {
      pollIntervalRef.current = setInterval(async () => {
        const updated = await loadJobDetails(activeJob.id);
        if (updated && updated.status !== 'RUNNING' && updated.status !== 'PAUSED') {
          clearInterval(pollIntervalRef.current);
          if (updated.status === 'COMPLETED') {
            success(`Automation job ${updated.id} finished successfully!`);
          }
        }
      }, 2000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeJob?.id, activeJob?.status]);

  const handleLiveFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveRegNo.trim() || !liveDob.trim()) {
      toastError('Please enter both Register Number and Date of Birth');
      return;
    }
    try {
      setLiveLoading(true);
      const res = await api.post<any>('/results/live-fetch', {
        register_number: liveRegNo.trim(),
        dob: liveDob.trim(),
        session_id: selectedSession || undefined,
      });
      setLiveResult(res);
      success(`Successfully retrieved official marksheet for ${res.student_name} (${res.register_number})!`);
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Failed to retrieve result from Nandha COE portal.');
    } finally {
      setLiveLoading(false);
    }
  };

  const handleDownloadBulkTemplate = async () => {
    try {
      info('Downloading official Nandha COE Bulk Sync template (.xlsx)...');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/results/nandha-bulk-template', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate bulk template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Nandha_COE_Bulk_Sync_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      success('Official template downloaded successfully!');
    } catch (err: any) {
      toastError(err.message || 'Template download failed.');
    }
  };

  const handleBulkRowChange = (index: number, field: 'register_number' | 'dob' | 'name', value: string) => {
    setBulkRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Dynamic row auto-append: typing in last row automatically appends next empty row!
      if (
        index === updated.length - 1 &&
        (value.trim().length > 0 || updated[index].register_number || updated[index].dob)
      ) {
        updated.push({
          id: String(Date.now() + Math.random()),
          register_number: '',
          dob: '',
          name: ''
        });
      }
      return updated;
    });
  };

  const handleAddBulkRow = () => {
    setBulkRows((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), register_number: '', dob: '', name: '' }
    ]);
  };

  const handleRemoveBulkRow = (index: number) => {
    if (bulkRows.length <= 1) {
      setBulkRows([{ id: '1', register_number: '', dob: '', name: '' }]);
      return;
    }
    setBulkRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetBulkRows = () => {
    setBulkRows([
      { id: '1', register_number: '732224CC031', dob: '01/06/2007', name: 'NANTHISH  S' },
      { id: '2', register_number: '', dob: '', name: '' }
    ]);
    setBulkReport(null);
  };

  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBulkUploading(true);
      info(`Parsing ${file.name} for candidate credentials...`);

      const formData = new FormData();
      formData.append('file', file);
      if (selectedSession) {
        formData.append('session_id', String(selectedSession));
      }

      const res = await api.post<any>('/results/nandha-bulk-upload', formData);
      setBulkReport(res);
      if (res.results && res.results.length > 0) {
        setBulkRows(
          res.results.map((r: any, idx: number) => ({
            id: String(idx + 1),
            register_number: r.register_number,
            dob: 'VERIFIED',
            name: r.student_name || ''
          }))
        );
      }
      success(`Bulk sync complete! Processed ${res.total_submitted} students (${res.success_count} success, ${res.failed_count} errors).`);
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Bulk upload failed.');
    } finally {
      setBulkUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExecuteBulkSync = async () => {
    const validRecords = bulkRows
      .filter((r) => r.register_number.trim() && r.dob.trim())
      .map((r) => ({
        register_number: r.register_number.trim().toUpperCase(),
        dob: r.dob.trim()
      }));

    if (validRecords.length === 0) {
      toastError('Please enter at least one candidate with both Register Number and Date of Birth');
      return;
    }

    try {
      setBulkLoading(true);
      info(`Connecting to Nandha portal for ${validRecords.length} students...`);
      const res = await api.post<any>('/results/nandha-bulk-sync', {
        session_id: selectedSession || undefined,
        records: validRecords
      });
      setBulkReport(res);
      success(`Live sync finished! ${res.success_count} of ${res.total_submitted} marksheets verified & published.`);
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Bulk synchronization failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownloadPdf = (regNo: string) => {
    const token = localStorage.getItem('token');
    const sessCode = sessions.find((s) => s.id === selectedSession)?.session_code || 'NOV_DEC_2025';
    const filename = `${regNo}_${sessCode}.pdf`;

    fetch(`/api/v1/pdfs/download/${filename}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Official PDF marksheet not yet generated.');
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

  const handlePreviewPdf = (regNo: string) => {
    const token = localStorage.getItem('token');
    const sessCode = sessions.find((s) => s.id === selectedSession)?.session_code || 'NOV_DEC_2025';
    const filename = `${regNo}_${sessCode}.pdf`;

    fetch(`/api/v1/pdfs/download/${filename}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load marksheet PDF');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        setPreviewPdfUrl(url);
        setPreviewFileName(filename);
        info(`Previewing official marksheet for ${regNo}`);
      })
      .catch((err) => toastError(err.message));
  };

  const handleStartAutomation = async () => {
    if (!selectedSession) {
      toastError('Please select an active examination session.');
      return;
    }
    setError(null);
    setActionLoading(true);

    try {
      const newJob = await api.post<AutomationJob>('/automation/jobs', {
        session_id: selectedSession,
        department_code: selectedDept || null,
        batch: selectedBatch || null,
        semester: selectedSemester || null,
      });
      setActiveJob(newJob);
      success(`Started Result Automation job: ${newJob.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger automation job.');
      toastError(err.message || 'Failed to start automation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJobControl = async (action: 'PAUSE' | 'RESUME' | 'CANCEL' | 'RETRY_FAILED') => {
    if (!activeJob) return;
    setActionLoading(true);
    try {
      await api.post(`/automation/jobs/${activeJob.id}/control`, { action });
      await loadJobDetails(activeJob.id);
      if (action === 'PAUSE') warning(`Automation job paused.`);
      else if (action === 'RESUME') info(`Automation job resumed.`);
      else if (action === 'CANCEL') toastError(`Automation job cancelled.`);
      else if (action === 'RETRY_FAILED') info(`Retrying failed records...`);
    } catch (err: any) {
      setError(err.message || `Failed to execute ${action} on job.`);
      toastError(err.message || `Failed to execute ${action}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const progressPercent =
    activeJob && activeJob.total_records > 0
      ? Math.round((activeJob.processed_count / activeJob.total_records) * 100)
      : 0;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Automated Processing Engine
              </span>
              <span className="text-slate-400 text-xs">• Idempotent & Deterministic</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight font-heading text-white">
              Result Automation Center
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Automated marksheet extraction, digital verification, grade reconciliation, and official COE records publication.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Live Nandha COE Autonomous Portal Gateway */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-blue-500/30 space-y-5">
        {/* Gateway Header with Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg ring-2 ring-blue-400/30 shrink-0">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight font-heading text-white">
                  Nandha Autonomous COE Live Results Gateway
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Connected
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Direct live synchronization with official portal:{' '}
                <a
                  href="https://coe.nandhaengg.org/results/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300 underline font-mono hover:text-white"
                >
                  coe.nandhaengg.org/results/
                </a>
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-blue-400/20 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setLiveGatewayMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                liveGatewayMode === 'single'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Single Candidate</span>
            </button>
            <button
              type="button"
              onClick={() => setLiveGatewayMode('bulk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                liveGatewayMode === 'bulk'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk Sheet Sync</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-200 rounded text-[9px] uppercase tracking-wider">
                Cohort
              </span>
            </button>
          </div>
        </div>

        {/* --- MODE 1: SINGLE CANDIDATE QUERY --- */}
        {liveGatewayMode === 'single' && (
          <div className="space-y-5 animate-fade-in">
            <form onSubmit={handleLiveFetch} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-blue-200 mb-1.5">
                  Register Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={liveRegNo}
                  onChange={(e) => setLiveRegNo(e.target.value.toUpperCase())}
                  placeholder="e.g. 732224CC031"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-blue-400/30 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-200 mb-1.5">
                  Date of Birth (DD/MM/YYYY) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={liveDob}
                  onChange={(e) => setLiveDob(e.target.value)}
                  placeholder="01/06/2007"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-blue-400/30 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={liveLoading}
                  className="w-full px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {liveLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting to Nandha COE...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>Fetch Official Live Marksheet</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Live Retrieved Single Result Card */}
            {liveResult && (
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 animate-fade-in space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-blue-300 font-bold block">
                      Candidate Credentials
                    </span>
                    <div className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>{liveResult.student_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono font-normal border border-blue-400/30">
                        {liveResult.register_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{liveResult.branch_name}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-blue-600/30 rounded-lg border border-blue-400/30 text-center">
                      <span className="text-[10px] text-blue-200 block uppercase font-bold">SGPA</span>
                      <span className="text-lg font-black font-mono text-emerald-400">{liveResult.gpa.toFixed(2)}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-600/30 rounded-lg border border-emerald-400/30 text-center">
                      <span className="text-[10px] text-emerald-200 block uppercase font-bold">Status</span>
                      <span className="text-sm font-bold text-emerald-300">{liveResult.result_status}</span>
                    </div>
                  </div>
                </div>

                {/* Courses Table */}
                {liveResult.courses && liveResult.courses.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-blue-200 font-bold">
                          <th className="py-2 px-2.5">Course Code</th>
                          <th className="py-2 px-2.5">Course Name</th>
                          <th className="py-2 px-2.5 text-center">Credits</th>
                          <th className="py-2 px-2.5 text-center">Grade</th>
                          <th className="py-2 px-2.5 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {liveResult.courses.map((c: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-2 px-2.5 font-mono text-blue-300 font-bold">{c.code}</td>
                            <td className="py-2 px-2.5 text-white">{c.name}</td>
                            <td className="py-2 px-2.5 text-center text-slate-300">{c.credits}</td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded font-bold font-mono text-xs bg-blue-500/30 text-blue-200 border border-blue-400/30">
                                {c.grade}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.result === 'PASS'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {c.result}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Marksheet Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => handlePreviewPdf(liveResult.register_number)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/20"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-300" />
                    <span>Preview Marksheet PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(liveResult.register_number)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Marksheet PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- MODE 2: BULK SHEET SYNCHRONIZER (COHORT MODE) --- */}
        {liveGatewayMode === 'bulk' && (
          <div className="space-y-4 animate-fade-in">
            {/* Top Toolbar Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/80 rounded-xl border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBulkTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white rounded-lg text-xs font-bold border border-blue-400/30 transition-all cursor-pointer"
                  title="Download pre-formatted Excel template"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download Bulk Template (.xlsx)</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleBulkFileUpload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={bulkUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold border border-indigo-400/40 transition-all cursor-pointer disabled:opacity-50"
                  title="Upload .xlsx or .csv sheet with Reg No and DOB"
                >
                  {bulkUploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Upload Completed Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddBulkRow}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetBulkRows}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Run Bulk Sync Action */}
              <button
                type="button"
                disabled={bulkLoading || bulkUploading}
                onClick={handleExecuteBulkSync}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all cursor-pointer disabled:opacity-50"
              >
                {bulkLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronizing with Nandha Portal...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>
                      Sync {bulkRows.filter((r) => r.register_number.trim() && r.dob.trim()).length} Candidates Live
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Smart Live Spreadsheet Table for Bulk Data */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/90 max-h-[360px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800 text-blue-200 font-bold sticky top-0 z-10 border-b border-white/10 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center text-slate-400">#</th>
                    <th className="py-2.5 px-3 w-48">Register Number *</th>
                    <th className="py-2.5 px-3 w-48">Date of Birth (DD/MM/YYYY) *</th>
                    <th className="py-2.5 px-3">Student Name (Optional Reference)</th>
                    <th className="py-2.5 px-3 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {bulkRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Register Number Cell */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          placeholder="e.g. 732224CC031"
                          value={row.register_number}
                          onChange={(e) => handleBulkRowChange(idx, 'register_number', e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-800 border border-blue-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                        />
                      </td>

                      {/* Date of Birth Cell */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          placeholder="01/06/2007"
                          value={row.dob}
                          onChange={(e) => handleBulkRowChange(idx, 'dob', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold bg-slate-800 border border-blue-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                        />
                      </td>

                      {/* Student Name Cell */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          placeholder="Candidate Name"
                          value={row.name}
                          onChange={(e) => handleBulkRowChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                        />
                      </td>

                      {/* Delete Row Cell */}
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveBulkRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Typing into the last row automatically appends the next empty row dynamically.</span>
              <span>Total rows: <strong className="text-white">{bulkRows.length}</strong></span>
            </div>

            {/* Bulk Synchronization Execution Summary Report */}
            {bulkReport && (
              <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 space-y-4 animate-fade-in">
                {/* Header Metrics */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white font-heading">
                        Live Bulk Synchronization Complete
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Marksheets extracted, digitally verified, and persisted to institutional ledger.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <div className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                      <span className="text-slate-300 text-[10px] block">TOTAL</span>
                      <strong className="text-white font-mono text-sm">{bulkReport.total_submitted}</strong>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                      <span className="text-emerald-300 text-[10px] block">SUCCESS</span>
                      <strong className="text-emerald-300 font-mono text-sm">{bulkReport.success_count}</strong>
                    </div>
                    {bulkReport.failed_count > 0 && (
                      <div className="px-3 py-1 bg-rose-500/20 border border-rose-400/30 rounded-lg">
                        <span className="text-rose-300 text-[10px] block">ERRORS</span>
                        <strong className="text-rose-300 font-mono text-sm">{bulkReport.failed_count}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Success Results Table */}
                {bulkReport.results && bulkReport.results.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-blue-200 font-bold border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-3">Register Number</th>
                          <th className="py-2.5 px-3">Candidate Name</th>
                          <th className="py-2.5 px-3">Branch</th>
                          <th className="py-2.5 px-3 text-center">Credits</th>
                          <th className="py-2.5 px-3 text-center">SGPA</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {bulkReport.results.map((res: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-blue-300">
                              {res.register_number}
                            </td>
                            <td className="py-2 px-3 font-medium text-white">{res.student_name}</td>
                            <td className="py-2 px-3 text-slate-300 text-[11px]">{res.branch_name}</td>
                            <td className="py-2 px-3 text-center text-slate-300 font-mono">
                              {res.total_credits}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-emerald-400">
                              {res.gpa ? res.gpa.toFixed(2) : '0.00'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  res.result_status === 'PASS'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {res.result_status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handlePreviewPdf(res.register_number)}
                                  className="p-1 px-2 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Preview PDF"
                                >
                                  <Eye className="w-3 h-3 text-blue-300" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPdf(res.register_number)}
                                  className="p-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Download PDF"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Error Breakdown Drawer (if any) */}
                {bulkReport.errors && bulkReport.errors.length > 0 && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>{bulkReport.errors.length} Candidate(s) Failed to Sync:</span>
                    </div>
                    <div className="space-y-1">
                      {bulkReport.errors.map((err: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-2 bg-black/20 rounded-lg text-slate-300 font-mono"
                        >
                          <span className="font-bold text-rose-300">{err.register_number}</span>
                          <span className="text-slate-400 font-sans">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step Pipeline Visualization Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold font-mono">
            1
          </div>
          <div>
            <div className="font-bold text-slate-900">Cohort Match</div>
            <p className="text-[11px] text-slate-400">Resolve candidates</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold font-mono">
            2
          </div>
          <div>
            <div className="font-bold text-slate-900">PDF Synthesis</div>
            <p className="text-[11px] text-slate-400">Digital Forensic Verification</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold font-mono">
            3
          </div>
          <div>
            <div className="font-bold text-slate-900">Deterministic SGPA</div>
            <p className="text-[11px] text-slate-400">Credit weighted math</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold font-mono">
            4
          </div>
          <div>
            <div className="font-bold text-slate-900">Ledger Persist</div>
            <p className="text-[11px] text-slate-400">Verified commit</p>
          </div>
        </div>
      </div>

      {/* Configuration & Pre-Run Validation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm font-heading">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Target Cohort Execution Parameters</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 1: Configure</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Examination Session *</label>
              <CustomDropdown
                value={selectedSession}
                onChange={(val: any) => setSelectedSession(val ? Number(val) : '')}
                options={sessions.map((s) => ({
                  value: s.id,
                  label: s.session_code,
                  badge: s.is_active ? 'Active' : undefined,
                  sublabel: s.session_name || undefined,
                }))}
                icon={Calendar}
                placeholder="Select Session"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Academic Department</label>
              <CustomDropdown
                value={selectedDept}
                onChange={(val: any) => setSelectedDept(val)}
                options={[
                  { value: '', label: 'All Departments' },
                  ...departments.map((d) => ({
                    value: d.code,
                    label: d.name,
                    badge: d.code,
                  })),
                ]}
                icon={Building2}
                placeholder="Select Department"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Batch Cohort</label>
              <CustomDropdown
                value={selectedBatch}
                onChange={(val: any) => setSelectedBatch(val)}
                options={[
                  { value: '2022-2026', label: '2022-2026 Cohort', badge: 'Final Yr' },
                  { value: '2023-2027', label: '2023-2027 Cohort', badge: '3rd Yr' },
                  { value: '2024-2028', label: '2024-2028 Cohort', badge: '2nd Yr' },
                  { value: '2025-2029', label: '2025-2029 Cohort', badge: '1st Yr' },
                ]}
                icon={GraduationCap}
                placeholder="Select Batch"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Semester</label>
              <CustomDropdown
                value={selectedSemester}
                onChange={(val: any) => setSelectedSemester(Number(val))}
                options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
                  value: s,
                  label: `Semester ${s}`,
                  badge: `SEM ${s}`,
                }))}
                icon={Clock}
                placeholder="Select Semester"
              />
            </div>
          </div>

          {/* Action Trigger */}
          {isStaff && (
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium">
                Idempotent run: Existing digitally verified records remain protected.
              </div>
              <button
                onClick={handleStartAutomation}
                disabled={actionLoading || activeJob?.status === 'RUNNING'}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Automation Run</span>
              </button>
            </div>
          )}
        </div>

        {/* Pre-Run Validation Summary */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Pre-Execution Verification</span>
            </div>
            <h3 className="font-extrabold text-base text-white font-heading">Safety & Compliance Protocol</h3>
            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Roster schema & constraints verified</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tamper-proof digital seal verification</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Deterministic SGPA calculation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Transactional pause, resume & rollback</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            System ready for high-throughput batch extraction.
          </div>
        </div>
      </div>

      {/* Live Automation Execution & Progress Monitoring */}
      {activeJob && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Job ID: {activeJob.id}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    activeJob.status === 'RUNNING'
                      ? 'bg-blue-100 text-blue-700 animate-pulse'
                      : activeJob.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : activeJob.status === 'PAUSED'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {activeJob.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Initiated by <strong className="text-slate-700">{activeJob.initiated_by}</strong> • Session:{' '}
                <strong className="text-slate-700 font-mono">{activeJob.session_code || selectedSession}</strong>
              </div>
            </div>

            {/* Controls: Pause, Resume, Cancel, Retry */}
            {isStaff && (
              <div className="flex items-center gap-2">
                {activeJob.status === 'RUNNING' && (
                  <button
                    onClick={() => handleJobControl('PAUSE')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Run</span>
                  </button>
                )}

                {activeJob.status === 'PAUSED' && (
                  <button
                    onClick={() => handleJobControl('RESUME')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Resume</span>
                  </button>
                )}

                {(activeJob.status === 'RUNNING' || activeJob.status === 'PAUSED') && (
                  <button
                    onClick={() => handleJobControl('CANCEL')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Abort Job</span>
                  </button>
                )}

                {activeJob.failed_count > 0 && activeJob.status !== 'RUNNING' && (
                  <button
                    onClick={() => handleJobControl('RETRY_FAILED')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Failed ({activeJob.failed_count})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar & Counters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Progress: <strong className="text-slate-900 font-mono">{activeJob.processed_count}</strong> of{' '}
                <strong className="text-slate-900 font-mono">{activeJob.total_records}</strong> Candidates Processed
              </span>
              <span className="font-extrabold text-blue-600 font-mono text-sm">{progressPercent}%</span>
            </div>
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 rounded-full shadow-inner"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Cohort</span>
                <span className="font-extrabold text-slate-800 text-lg font-mono">{activeJob.total_records}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-emerald-600 block font-bold uppercase">Verified Success</span>
                <span className="font-extrabold text-emerald-800 text-lg font-mono">{activeJob.success_count}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <span className="text-[10px] text-rose-600 block font-bold uppercase">Failed Records</span>
                <span className="font-extrabold text-rose-800 text-lg font-mono">{activeJob.failed_count}</span>
              </div>
            </div>
          </div>

          {/* Live Student Execution Logs */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-blue-600" />
                <span>Live Execution Terminal Stream</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Real-time socket polling</span>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 space-y-1.5 shadow-inner">
              {activeJob.logs && activeJob.logs.length > 0 ? (
                activeJob.logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-blue-400 font-bold shrink-0">{log.register_number}</span>
                    <span className="text-slate-300">- {log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 py-6 text-center font-sans text-xs">
                  Awaiting live execution streaming logs...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

