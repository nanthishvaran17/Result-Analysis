import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  FileSpreadsheet,
  Cpu,
  Fingerprint,
  ShieldCheck,
  Clock,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DemoRole {
  id: string;
  label: string;
  roleTitle: string;
  username: string;
  pass: string;
  clearance: string;
  badgeStyle: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: 'admin',
    label: 'Chief Admin',
    roleTitle: 'Controller',
    username: 'admin',
    pass: 'AdminPassword123!',
    clearance: 'Tier 1 • Full Clearance',
    badgeStyle: 'border-blue-600 bg-blue-50/90 text-blue-900 ring-1 ring-blue-500/40'
  },
  {
    id: 'officer',
    label: 'Exam Officer',
    roleTitle: 'Senior Officer',
    username: 'exam_officer',
    pass: 'OfficerPass123!',
    clearance: 'Tier 2 • Ledger Verification',
    badgeStyle: 'border-indigo-600 bg-indigo-50/90 text-indigo-900 ring-1 ring-indigo-500/40'
  },
  {
    id: 'auditor',
    label: 'Auditor / Dean',
    roleTitle: 'Inspection Dean',
    username: 'faculty_viewer',
    pass: 'ViewerPass123!',
    clearance: 'Tier 3 • Read-Only Audit',
    badgeStyle: 'border-emerald-600 bg-emerald-50/90 text-emerald-900 ring-1 ring-emerald-500/40'
  }
];

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both authorized ID and password.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials or security token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectRole = (role: DemoRole) => {
    setSelectedRole(role.id);
    setUsername(role.username);
    setPassword(role.pass);
    setError(null);
  };

  return (
    <div className="h-screen max-h-screen w-full bg-slate-100/90 text-slate-900 flex flex-col justify-between font-sans overflow-hidden select-none">
      {/* Background Soft Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/50 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-200/40 rounded-full blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-sky-200/40 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* COMPACT TOP HEADER */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 sm:px-10 py-2.5 z-20 shadow-2xs shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-800 flex items-center justify-center text-white shadow-md shadow-blue-600/20 border border-white shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider text-slate-900 uppercase font-heading">
                  OFFICE OF THE CONTROLLER OF EXAMINATIONS
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                  AUTONOMOUS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                Anna University Affiliated • NAAC 'A+' Grade • AICTE Approved
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>COE Central Node: <strong className="text-emerald-700">Online</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] shadow-2xs font-semibold">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>{currentTime || '07:30:00 PM'} IST</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT: FITS PERFECTLY WITHOUT SCROLLING */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-center z-10 overflow-hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-300/40 overflow-hidden max-h-[82vh]">

          {/* LEFT COMMAND SHOWCASE (Cols: 7) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-white to-blue-50/30">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold tracking-wide uppercase mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Autonomous Examination Operations Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading leading-tight mb-2">
                EXAMINATION RESULT AUTOMATION & INTELLIGENCE SYSTEM
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                Automated marksheet PDF ingestion, real-time standing arrear reconciliation, deterministic GPA calculation, and enterprise 5-sheet publication matrices.
              </p>

              {/* Stat Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-sky-50/80 border border-blue-100/90 mb-4 shadow-xs">
                <div>
                  <div className="text-lg font-black text-blue-700 font-heading">100%</div>
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Accuracy</div>
                  <div className="text-[9px] text-slate-500">Deterministic Engine</div>
                </div>
                <div className="border-x border-blue-200/60 px-2">
                  <div className="text-lg font-black text-indigo-700 font-heading">&lt; 1.2s</div>
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Gazette Parsing</div>
                  <div className="text-[9px] text-slate-500">High-Throughput</div>
                </div>
                <div className="pl-2">
                  <div className="text-lg font-black text-cyan-700 font-heading">5 Sheets</div>
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Excel Ledger</div>
                  <div className="text-[9px] text-slate-500">Publication Ready</div>
                </div>
              </div>

              {/* 4 Feature Cards (Compact) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 truncate">Autonomous PDF Extraction</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Auto-parses official Anna University gazettes and marksheets with zero transcription error.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-indigo-400 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 truncate">5-Sheet Executive Excel</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Instant generation of Result Analysis, Summary, Arrear Ledger, Logs, and Subject Maps.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 truncate">Cryptographic Audit Logs</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Every result ledger is signed with SHA-256 digital hashes for tamper-proof verification.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-sky-400 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 truncate">Role-Based Clearance</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Fine-grained controls for Chief Controller, Senior Officers, and Academic Auditors.
                  </p>
                </div>
              </div>
            </div>

            {/* Accreditation Strip */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>NAAC 'A+' Grade • ISO 27001 Certified Security</span>
              </div>
              <div>
                <span>Exam Session: <strong className="text-slate-900">NOV / DEC 2025</strong></span>
              </div>
            </div>
          </div>

          {/* RIGHT EXECUTIVE LOGIN TERMINAL (Cols: 5) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white relative">
            <div>
              {/* Title */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 font-heading">
                    Official Portal Login
                  </h2>
                  <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-md bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                    SECURE GATEWAY
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Enter authorized institutional credentials to access examination processing and records.
                </p>
              </div>

              {/* Role Clearance Selector */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Select Clearance Profile:
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">Click to pre-fill</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {DEMO_ROLES.map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => selectRole(r)}
                        className={`py-1.5 px-2 rounded-xl text-left border transition-all cursor-pointer relative shadow-2xs ${
                          isSelected
                            ? `${r.badgeStyle}`
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate text-slate-900">{r.label}</div>
                        <div className="text-[9px] text-slate-500 truncate">{r.roleTitle}</div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800 animate-slide-down">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Official ID */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official ID / Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or exam_officer"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-mono font-medium shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-mono tracking-wider font-medium shadow-2xs"
                    />
                  </div>
                </div>

                {/* Remember & Version */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 text-[11px]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Save session</span>
                  </label>
                  <span className="text-[10px] font-medium text-slate-400">v2.4.0 COE Enterprise</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:via-indigo-800 hover:to-blue-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 hover:shadow-blue-600/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authorizing Clearance...</span>
                    </div>
                  ) : (
                    <>
                      <span>Authorize & Enter Controller Portal</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Compliance Notice */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-[9.5px] text-slate-500 leading-tight flex items-start gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
              <span>
                Office of the Controller of Examinations • Restricted institutional access. All transactions and reports are cryptographically logged with IP and audit timestamps.
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* COMPACT BOTTOM FOOTER */}
      <footer className="w-full bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-6 sm:px-10 text-xs text-slate-500 z-20 shadow-2xs shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="text-[11px]">
            © 2026 Office of the Controller of Examinations. All Rights Reserved.
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span>Autonomous Examination Automation Core</span>
            <span>•</span>
            <span>Security Standard ISO/IEC 27001</span>
            <span>•</span>
            <span className="text-blue-600 font-semibold">Official Confidential Portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
