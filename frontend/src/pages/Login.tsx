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
  Building2,
  Clock,
  CheckCircle2,
  Award,
  Database,
  BarChart3
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
  iconBg: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: 'admin',
    label: 'Chief Admin',
    roleTitle: 'Controller of Examinations',
    username: 'admin',
    pass: 'AdminPassword123!',
    clearance: 'Tier 1 Clearance • Full System Control & Publishing',
    badgeStyle: 'border-blue-600 bg-blue-50/90 text-blue-900 ring-2 ring-blue-500/30',
    iconBg: 'bg-blue-600 text-white'
  },
  {
    id: 'officer',
    label: 'Exam Officer',
    roleTitle: 'Senior Examination Officer',
    username: 'exam_officer',
    pass: 'OfficerPass123!',
    clearance: 'Tier 2 Clearance • PDF Ingestion & Ledger Verification',
    badgeStyle: 'border-indigo-600 bg-indigo-50/90 text-indigo-900 ring-2 ring-indigo-500/30',
    iconBg: 'bg-indigo-600 text-white'
  },
  {
    id: 'auditor',
    label: 'Auditor / Dean',
    roleTitle: 'Academic Inspection Auditor',
    username: 'faculty_viewer',
    pass: 'ViewerPass123!',
    clearance: 'Tier 3 Clearance • Read-Only Analytics & Audit Export',
    badgeStyle: 'border-emerald-600 bg-emerald-50/90 text-emerald-900 ring-2 ring-emerald-500/30',
    iconBg: 'bg-emerald-600 text-white'
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
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col justify-between font-sans relative overflow-x-hidden">
      {/* Background Subtle Ambient Illuminations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[42rem] h-[42rem] bg-blue-200/40 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[38rem] h-[38rem] bg-indigo-200/40 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/4 w-[36rem] h-[36rem] bg-sky-200/35 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* TOP INSTITUTIONAL HEADER BAR */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 sm:px-12 py-3.5 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Institution Crest & Accreditation */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-800 flex items-center justify-center text-white shadow-md shadow-blue-600/25 border border-white shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider text-slate-900 uppercase font-heading">
                  OFFICE OF THE CONTROLLER OF EXAMINATIONS
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                  AUTONOMOUS INSTITUTION
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Affiliated to Anna University • Approved by AICTE • Accredited with 'A+' Grade by NAAC
              </p>
            </div>
          </div>

          {/* Real-Time System Telemetry & Clock */}
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-medium shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>COE Secure Node: <strong>Online</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] shadow-2xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentTime || '07:30:00 PM'} IST</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN MASSIVE SHOWCASE & LOGIN VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center z-10 my-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/50 overflow-hidden">

          {/* LEFT COMMAND SHOWCASE (Cols: 7) */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-white to-blue-50/30">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase mb-6 shadow-2xs">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Next-Gen Examination Operations Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-heading leading-tight mb-4">
                AUTONOMOUS RESULT AUTOMATION & INTELLIGENCE SYSTEM
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed font-normal mb-8">
                Autonomous marksheet PDF ingestion, real-time standing arrear reconciliation, deterministic GPA computation, and enterprise publication-grade Excel reporting.
              </p>

              {/* High-Impact Stat Metrics Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-sky-50/80 border border-blue-100/90 mb-8 shadow-xs">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-blue-700 font-heading">100%</div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Calculation Accuracy</div>
                  <div className="text-[10px] text-slate-500">Deterministic Engine</div>
                </div>
                <div className="border-x border-blue-200/60 px-3">
                  <div className="text-xl sm:text-2xl font-black text-indigo-700 font-heading">&lt; 1.2s</div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Gazette PDF OCR</div>
                  <div className="text-[10px] text-slate-500">High-Throughput</div>
                </div>
                <div className="pl-2">
                  <div className="text-xl sm:text-2xl font-black text-cyan-700 font-heading">5 Sheets</div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Executive Excel</div>
                  <div className="text-[10px] text-slate-500">Publication Ready</div>
                </div>
              </div>

              {/* 4 Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Autonomous PDF Extraction</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Auto-parses official gazette ledgers, extracting subjects, grades, and candidate details with zero error.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">5-Sheet Executive Excel</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Generates Result Analysis, Performance Summary, Arrear Ledger, Processing Logs, and Subject Maps.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Cryptographic Audit Logs</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Every marksheet and report is cryptographically signed with SHA-256 hashes to guarantee data integrity.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-sky-400 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Role-Based Clearance</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Granular operational controls for Chief Controller, Senior Officers, and Academic Inspection Deans.
                  </p>
                </div>
              </div>
            </div>

            {/* Accreditation Verification Strip */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-slate-700">NAAC 'A+' Grade • ISO 27001 Certified Security</span>
              </div>
              <div className="flex items-center gap-3 font-medium">
                <span>Active Exam Session: <strong className="text-slate-900">NOV / DEC 2025</strong></span>
              </div>
            </div>
          </div>

          {/* RIGHT EXECUTIVE LOGIN TERMINAL (Cols: 5) */}
          <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between bg-white relative">
            <div>
              {/* Terminal Title */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                    Official Portal Login
                  </h2>
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-md bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                    SECURE GATEWAY
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter authorized institutional credentials to access examination processing, student records, and analytics.
                </p>
              </div>

              {/* Role Clearance Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Select Clearance Profile:
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">Click to pre-fill</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_ROLES.map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => selectRole(r)}
                        className={`py-2 px-2.5 rounded-xl text-left border transition-all cursor-pointer relative shadow-2xs ${
                          isSelected
                            ? `${r.badgeStyle}`
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate text-slate-900">{r.label}</div>
                        <div className="text-[9px] text-slate-500 truncate">{r.roleTitle.split(' ')[0]}</div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 animate-slide-down shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Official ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official ID / Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or exam_officer"
                      className="w-full pl-10 pr-3.5 py-3 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-mono font-medium shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-mono tracking-wider font-medium shadow-2xs"
                    />
                  </div>
                </div>

                {/* Remember Me Checkbox & System Tag */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Save session on workstation</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">v2.4.0 COE Enterprise</span>
                </div>

                {/* Massive Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:via-indigo-800 hover:to-blue-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authorizing Official Clearance...</span>
                    </div>
                  ) : (
                    <>
                      <span>Authorize & Enter Controller Portal</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Legal / Institutional Compliance Notice */}
            <div className="mt-8 pt-5 border-t border-slate-200 text-[10px] text-slate-500 leading-normal flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <span>
                Office of the Controller of Examinations • Restricted institutional system. All transactions, PDF parsing jobs, and report exports are cryptographically logged with IP and timestamp auditing under Examination Regulations.
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* BOTTOM INSTITUTIONAL FOOTER BAR */}
      <footer className="w-full bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3.5 px-6 sm:px-12 text-center text-xs text-slate-500 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 Office of the Controller of Examinations. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
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
