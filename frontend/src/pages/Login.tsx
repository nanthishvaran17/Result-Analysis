import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DemoRole {
  id: string;
  label: string;
  roleTitle: string;
  username: string;
  pass: string;
  clearance: string;
  badgeColor: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: 'admin',
    label: 'Chief Admin',
    roleTitle: 'Controller of Examinations',
    username: 'admin',
    pass: 'AdminPassword123!',
    clearance: 'Tier 1 • Full System Clearance',
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-400'
  },
  {
    id: 'staff',
    label: 'Exam Officer',
    roleTitle: 'Senior Examination Staff',
    username: 'exam_officer',
    pass: 'OfficerPass123!',
    clearance: 'Tier 2 • Results Upload & Verification',
    badgeColor: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
  },
  {
    id: 'auditor',
    label: 'Auditor / Dean',
    roleTitle: 'Academic Inspection Auditor',
    username: 'faculty_viewer',
    pass: 'ViewerPass123!',
    clearance: 'Tier 3 • Read-Only Analytics Clearance',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both authorized username and password.');
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
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Dynamic Background Ambient Glows & Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] bg-cyan-600/15 rounded-full blur-[128px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Main Dual-Pane High-Level Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-2xl shadow-black/80 backdrop-blur-2xl overflow-hidden relative z-10">

        {/* LEFT PANE: Institutional Prestige & Platform Features (Cols: 7) */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/70 relative bg-gradient-to-br from-slate-950/80 via-slate-900/50 to-slate-950/90">
          <div>
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Office of the Controller of Examinations</span>
            </div>

            {/* University Crest / Title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-heading">
                  EXAMINATION RESULT AUTOMATION PLATFORM
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  Autonomous Result Extraction, Arrear Intelligence & Enterprise Analytics
                </p>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-blue-500/40 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-white mb-1">Autonomous PDF Extraction</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-throughput Anna University gazette and marksheet OCR with 99.98% deterministic precision.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-indigo-500/40 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-white mb-1">5-Sheet Executive Excel</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated publication matrices, dynamic subject distributions, formula totals, and print presets.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-emerald-500/40 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-white mb-1">Cryptographic Audit Logs</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Immutable SHA-256 result hashing, verified standing arrears history, and strict session integrity.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-cyan-500/40 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-white mb-1">Multi-Tier RBAC Access</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fine-grained operational roles for Controller of Examinations, Staff Officers, and Academic Auditors.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Live System Telemetry Strip */}
          <div className="mt-8 pt-6 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-slate-300">COE Primary Node: Online (12ms)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">•</span>
              <span>Session: <strong className="text-slate-300">NOV / DEC 2025</strong></span>
              <span className="text-slate-500">•</span>
              <span>TLS 1.3 256-Bit</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Modern High-Security Glassmorphic Login Gateway (Cols: 5) */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between bg-slate-950/95 relative">
          <div>
            {/* Form Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg sm:text-xl font-bold text-white font-heading">
                  Staff Authentication
                </h2>
                <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  SECURE PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sign in with authorized institutional credentials to manage exam records and reporting.
              </p>
            </div>

            {/* Quick Role Selection Tabs for Easy Testing/Access */}
            <div className="mb-6">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Select Clearance Profile:</span>
                <span className="text-[10px] text-blue-400 font-normal">Click to quick-fill credentials</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ROLES.map((r) => {
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectRole(r)}
                      className={`py-2 px-2.5 rounded-xl text-left border transition-all cursor-pointer relative ${
                        isSelected
                          ? `${r.badgeColor} ring-1 ring-blue-500/50 shadow-md`
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-white truncate">{r.label}</div>
                      <div className="text-[9px] text-slate-400 truncate">{r.roleTitle.split(' ')[0]}</div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-950/50 border border-red-500/50 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-slide-down">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Staff Identifier / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or exam_officer"
                    className="w-full pl-10 pr-3.5 py-3 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Portal Security Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
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
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono tracking-wider"
                  />
                </div>
              </div>

              {/* Remember & Clearance Info */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded-sm bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Save session on workstation</span>
                </label>
                <span className="text-[11px] text-slate-500">v2.4.0 COE Enterprise</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authorizing Clearance...</span>
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

          {/* Institutional Compliance Notice Footer */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 text-[10px] text-slate-500 leading-normal flex items-start gap-2">
            <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Restricted examination control system. All transactions, PDF parsing jobs, and report exports are cryptographically logged with IP and timestamp auditing under Controller of Examinations Regulations.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
