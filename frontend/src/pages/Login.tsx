import React, { useState } from 'react';
import { GraduationCap, Lock, User, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-800/20 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-950 p-8 text-center border-b border-slate-800">
          <div className="w-14 h-14 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">EXAM AUTOMATION PLATFORM</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Controller of Examinations • Staff Portal</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or exam_officer"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Controller Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Authorized Role for Verification:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('admin', 'AdminPassword123!')}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 text-center transition-colors cursor-pointer"
              >
                Chief Admin
              </button>
              <button
                type="button"
                onClick={() => quickLogin('exam_officer', 'OfficerPass123!')}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 text-center transition-colors cursor-pointer"
              >
                Exam Staff
              </button>
              <button
                type="button"
                onClick={() => quickLogin('faculty_viewer', 'ViewerPass123!')}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 text-center transition-colors cursor-pointer"
              >
                Auditor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
