import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  ChevronRight,
  AlertCircle,
  KeyRound,
  X,
  Shield,
  FileSpreadsheet,
  Award,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DemoRole {
  id: string;
  label: string;
  roleTitle: string;
  username: string;
  pass: string;
  clearance: string;
  tier: string;
  icon: 'shield' | 'officer' | 'auditor';
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: 'admin',
    label: 'Chief Admin',
    roleTitle: 'COE Controller',
    username: 'admin',
    pass: 'AdminPassword123!',
    clearance: 'Full Authority',
    tier: 'Tier 1',
    icon: 'shield'
  },
  {
    id: 'officer',
    label: 'Exam Officer',
    roleTitle: 'Senior Officer',
    username: 'exam_officer',
    pass: 'OfficerPass123!',
    clearance: 'Ledger Audit',
    tier: 'Tier 2',
    icon: 'officer'
  },
  {
    id: 'auditor',
    label: 'Dean / Auditor',
    roleTitle: 'Inspection Dean',
    username: 'faculty_viewer',
    pass: 'ViewerPass123!',
    clearance: 'Read-Only',
    tier: 'Tier 3',
    icon: 'auditor'
  }
];

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

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
    <div className="h-screen max-h-screen w-full flex flex-col lg:flex-row bg-[#0f172a] text-slate-900 font-sans selection:bg-sky-500 selection:text-white overflow-hidden">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: 50% WIDTH, PERFECTLY CENTERED CONTENT ("Idhu Paathi - Center") */}
      {/* ========================================================================= */}
      <div className="relative w-full lg:w-1/2 h-full flex flex-col justify-between px-6 sm:px-10 lg:px-12 py-5 sm:py-6 lg:py-8 overflow-hidden">
        {/* Background Campus Aerial Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('/campus_bg.jpg')`
          }}
        />

        {/* Cinematic Vignette & Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/80 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-sky-950/20 mix-blend-multiply" />

        {/* Centered Left Content Container */}
        <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col justify-between h-full">
          {/* TOP BRANDING CARD: Institutional Portal Badge */}
          <div>
            <div className="inline-flex items-center gap-3.5 px-4 py-2 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-white/15 shadow-2xl shadow-black/50">
              {/* 25th Year NEC Emblem */}
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400/90 flex flex-col items-center justify-center text-center p-0.5 bg-cyan-950/60 shadow-inner shrink-0 ring-1 ring-cyan-400/30">
                <span className="text-[11px] font-black text-white leading-none tracking-tight">COE</span>
                <span className="text-[7px] font-extrabold text-cyan-300 leading-none tracking-widest mt-0.5 uppercase">NEC</span>
              </div>

              {/* Institution Title */}
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-cyan-400">
                  OFFICE OF THE CONTROLLER OF EXAMINATIONS
                </div>
                <div className="text-sm font-extrabold text-white tracking-tight leading-tight">
                  Examination Result Automation Platform
                </div>
                <div className="text-[10px] text-slate-300 font-medium">
                  Nandha Engineering College (Autonomous) · Erode
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: HERO TAGLINE & PHILOSOPHY */}
          <div className="my-auto py-3">
            {/* Live Telemetry Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10.5px] font-bold tracking-wider uppercase mb-3 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>AUTONOMOUS COE PORTAL · LIVE RESULT AUDIT</span>
            </div>

            {/* Primary Statement */}
            <h1 className="text-3xl sm:text-4xl lg:text-[38px] font-black text-white tracking-tight leading-[1.15] mb-3 drop-shadow-md font-heading">
              Every marksheet,<br />
              verified and on record.
            </h1>

            <p className="text-xs sm:text-[13px] text-slate-200/90 font-normal leading-relaxed drop-shadow max-w-md">
              Automated marksheet PDF ingestion, real-time standing arrear reconciliation, deterministic SGPA/CGPA computation, and enterprise 5-sheet publication matrices.
            </p>
          </div>

          {/* BOTTOM SECTION: TELEMETRY KPI METRICS CARD */}
          <div className="w-full">
            <div className="rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/15 p-3.5 shadow-2xl shadow-black/60 space-y-2">
              {/* Metric 1 */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white leading-tight">
                    Academic Cohorts & Students
                  </div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">
                    Live batch & semester roster sync
                  </div>
                </div>
                <div className="px-2.5 py-0.5 rounded-md bg-[#0284c7]/30 border border-sky-400/40 text-sky-200 text-xs font-black tracking-wide shrink-0">
                  1,240+ Enrolled
                </div>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div>
                  <div className="text-xs font-bold text-white leading-tight">
                    COE Gazette Extraction Engine
                  </div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">
                    Autonomous & Anna Univ. Regulations
                  </div>
                </div>
                <div className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black tracking-wider uppercase shrink-0">
                  ACTIVE
                </div>
              </div>

              {/* Metric 3 */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div>
                  <div className="text-xs font-bold text-white leading-tight">
                    Cryptographic SHA-256 Digest
                  </div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">
                    5-Sheet Executive Excel Matrices
                  </div>
                </div>
                <div className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[11px] font-black tracking-wider uppercase shrink-0">
                  VERIFIED
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: 50% WIDTH, CRISP PURE WHITE BACKGROUND & HIGH CONTRAST      */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 h-full bg-white flex flex-col justify-between px-6 sm:px-10 lg:px-12 py-5 sm:py-6 lg:py-8 z-20 overflow-y-auto border-l border-slate-200">
        {/* Top spacer / header */}
        <div className="w-full max-w-md mx-auto my-auto py-1">
          {/* Header Title */}
          <div className="mb-3.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>COE Secure Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight font-heading leading-tight">
              Sign in to your workspace
            </h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Use your authorized institutional credentials to authenticate.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* EXECUTIVE ROLE CLEARANCE SELECTOR (Star-Free & Seamless)                  */}
          {/* ========================================================================= */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Authorized Personnel Clearance
              </span>
              <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold uppercase tracking-wider border border-blue-200/60">
                1-Click Access
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEMO_ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => selectRole(role)}
                    className={`relative p-2.5 rounded-xl text-left border transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-500/30 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    {/* Top row with icon & tier */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          role.id === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : role.id === 'officer'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {role.id === 'admin' && <Shield className="w-3.5 h-3.5" />}
                        {role.id === 'officer' && <FileSpreadsheet className="w-3.5 h-3.5" />}
                        {role.id === 'auditor' && <Award className="w-3.5 h-3.5" />}
                      </div>

                      <span
                        className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        {role.tier}
                      </span>
                    </div>

                    {/* Middle: Title & Role */}
                    <div>
                      <div className="font-extrabold text-[11px] leading-tight text-slate-900 truncate">
                        {role.label}
                      </div>
                      <div className="text-[9px] text-slate-500 leading-tight mt-0.5 truncate">
                        {role.roleTitle}
                      </div>
                    </div>

                    {/* Bottom: Username badge */}
                    <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-[9px] text-slate-700 font-bold truncate">
                        @{role.username}
                      </span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              or enter credentials
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2 text-xs animate-shake shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email / Username Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Institutional Email or User ID
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  id="username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username or email"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0072b2] focus:border-[#0072b2] shadow-2xs transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0072b2] focus:border-[#0072b2] shadow-2xs transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#0072b2] focus:ring-[#0072b2] accent-[#0072b2]"
                />
                <span className="text-slate-600 font-medium">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[#0072b2] hover:text-[#005a8e] font-semibold hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0072b2] to-[#005a8e] hover:from-[#005f96] hover:to-[#004e7c] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-900/15 hover:shadow-lg transition-all cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* NEED HELP CARD */}
          <div
            onClick={() => setShowHelpModal(true)}
            className="mt-2.5 p-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition flex items-center justify-between cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0072b2] shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 leading-snug">
                  Need help accessing your account?
                </div>
                <div className="text-[10px] text-slate-500">
                  Contact institutional COE administrator.
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" />
          </div>

        </div>

        {/* FOOTER */}
        <div className="text-center pt-2 border-t border-slate-200 max-w-md mx-auto w-full">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secured & audited by institution</span>
          </div>
          <div className="text-[9px] text-slate-400">
            © 2026 Nandha Engineering College. All rights reserved.
          </div>
          <div className="text-[9.5px] font-black text-slate-700 tracking-widest uppercase mt-0.5">
            LEARN | SERVE | SUCCEED
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NEED HELP ACCESSING ACCOUNT */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0072b2] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Institutional Support</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              If you have lost access to your Nandha institutional email or need credential renewal for the Examination Result System, please reach out to the COE helpdesk:
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Office:</span>
                <span className="font-semibold text-slate-800">Controller of Examinations (COE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Official Email:</span>
                <span className="font-semibold text-blue-600">coe@nandhaengg.org</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Campus Intercom:</span>
                <span className="font-semibold text-slate-800">Ext. 204 / 205</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Working Hours:</span>
                <span className="font-semibold text-slate-800">08:30 AM – 05:00 PM IST</span>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0072b2] text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORGOT PASSWORD */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Reset Institutional Password</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Enter your registered staff email ID. A cryptographically signed password reset authorization link will be generated.
            </p>

            <div className="mb-4">
              <input
                type="email"
                defaultValue={username}
                placeholder="staff.coe@nandhaengg.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0072b2]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowForgotModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Password recovery link dispatched to your institutional inbox.');
                  setShowForgotModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0072b2] text-white font-bold text-xs"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
