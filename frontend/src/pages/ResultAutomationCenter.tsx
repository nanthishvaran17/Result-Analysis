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
  Clock
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CustomDropdown } from '../components/CustomDropdown';
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
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [selectedBatch, setSelectedBatch] = useState<string>('2022-2026');
  const [selectedSemester, setSelectedSemester] = useState<number>(5);

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
              Autonomous extraction, marksheet PDF parsing via pdfplumber, SHA-256 cryptographic verification, and ACID transaction persistence.
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
            <p className="text-[11px] text-slate-400">pdfplumber & SHA-256</p>
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
                <span>SHA-256 PDF integrity sealing</span>
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
    </div>
  );
};
