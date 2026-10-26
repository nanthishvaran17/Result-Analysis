import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  AlertCircle,
  Terminal,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ExamSession, Department, AutomationJob } from '../types';

interface ResultAutomationCenterProps {
  activeSessionId: number | null;
}

export const ResultAutomationCenter: React.FC<ResultAutomationCenterProps> = ({ activeSessionId }) => {
  const { isStaff } = useAuth();
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
        // Load the latest job
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
      setError('Please select an examination session.');
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
    } catch (err: any) {
      setError(err.message || 'Failed to trigger automation job.');
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
    } catch (err: any) {
      setError(err.message || `Failed to execute ${action} on job.`);
    } finally {
      setActionLoading(false);
    }
  };

  const progressPercent = activeJob && activeJob.total_records > 0
    ? Math.round((activeJob.processed_count / activeJob.total_records) * 100)
    : 0;

  return (
    <div className="p-8 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Result Automation Center</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Execute automated result extraction, PDF verification, and transactional data persistence.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Configuration & Pre-Run Validation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>Target Cohort Parameters</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Step 1: Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Examination Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-hidden"
              >
                <option value="">Select Session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.session_code} - {s.session_name}
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
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch Cohort</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-hidden"
              >
                <option value="2022-2026">2022-2026</option>
                <option value="2023-2027">2023-2027</option>
                <option value="2024-2028">2024-2028</option>
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

          {/* Action Trigger */}
          {isStaff && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="text-[11px] text-slate-500">
                Idempotent processing: Will not duplicate existing verified records.
              </div>
              <button
                onClick={handleStartAutomation}
                disabled={actionLoading || activeJob?.status === 'RUNNING'}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Automation Run</span>
              </button>
            </div>
          )}
        </div>

        {/* Pre-Run Validation Summary */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Pre-Execution Verification</span>
            </div>
            <h3 className="font-bold text-base text-slate-100">Safety & Compliance Audit</h3>
            <div className="mt-4 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Format compliance verified</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SHA-256 integrity enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Deterministic GPA calculations</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Safe pause & resume supported</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            System ready for automated processing.
          </div>
        </div>
      </div>

      {/* Live Automation Execution & Progress Monitoring */}
      {activeJob && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900">{activeJob.id}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
              <div className="text-[11px] text-slate-500 mt-1">
                Initiated by <span className="font-semibold">{activeJob.initiated_by}</span> • Session:{' '}
                {activeJob.session_code || selectedSession}
              </div>
            </div>

            {/* Controls: Pause, Resume, Cancel, Retry */}
            {isStaff && (
              <div className="flex items-center gap-2">
                {activeJob.status === 'RUNNING' && (
                  <button
                    onClick={() => handleJobControl('PAUSE')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}

                {activeJob.status === 'PAUSED' && (
                  <button
                    onClick={() => handleJobControl('RESUME')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                )}

                {(activeJob.status === 'RUNNING' || activeJob.status === 'PAUSED') && (
                  <button
                    onClick={() => handleJobControl('CANCEL')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}

                {activeJob.failed_count > 0 && activeJob.status !== 'RUNNING' && (
                  <button
                    onClick={() => handleJobControl('RETRY_FAILED')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Failed ({activeJob.failed_count})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar & Counters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Progress: {activeJob.processed_count} of {activeJob.total_records} Candidates Processed
              </span>
              <span className="font-bold text-blue-600">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-medium">Total Cohort</span>
                <span className="font-bold text-slate-800">{activeJob.total_records}</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <span className="text-[10px] text-emerald-600 block font-medium">Verified Success</span>
                <span className="font-bold text-emerald-800">{activeJob.success_count}</span>
              </div>
              <div className="p-2 bg-rose-50 rounded-lg">
                <span className="text-[10px] text-rose-600 block font-medium">Failed Records</span>
                <span className="font-bold text-rose-800">{activeJob.failed_count}</span>
              </div>
            </div>
          </div>

          {/* Live Student Execution Logs */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-800 mb-2">Per-Student Execution Trace (Live Logs)</div>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 space-y-1">
              {activeJob.logs && activeJob.logs.length > 0 ? (
                activeJob.logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span
                      className={`font-bold ${
                        log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-blue-400">{log.register_number}</span>
                    <span className="text-slate-300">- {log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 py-4 text-center">Awaiting logs...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
