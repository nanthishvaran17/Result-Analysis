import React, { useEffect, useState } from 'react';
import {
  Shield,
  UserPlus,
  AlertCircle,
  Lock,
  Server
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import type { User, Role } from '../types';

export const StaffSettings: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'EXAM_STAFF' as Role,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<User[]>('/settings/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings/users', newUser);
      setIsAddUserModalOpen(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'EXAM_STAFF',
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member.');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await api.put(`/settings/users/${user.id}`, { is_active: !user.is_active });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Access Restricted: Chief Administrator permissions required to manage staff accounts.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Roles & Platform Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access control (RBAC), credentials management, and institutional security configuration.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsAddUserModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Staff Account</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Definitions Reference Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Chief Admin (ADMIN)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Full root authority: user provisioning, session configuration, student deletion, and audit trail.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Examination Staff (EXAM_STAFF)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Operational authority: student imports, automation execution, result verification, and Excel reports.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
            <Server className="w-4 h-4 text-slate-600" />
            <span>Auditor / Observer (VIEWER)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Read-only examination access: matrix inspection, verified report downloads, and statistical analysis.
          </p>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900">Authorized Personnel Directory</h3>
          <span className="text-xs text-slate-400">{users.length} Active Accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Institutional Email</th>
                <th className="py-3 px-4 text-center">Assigned Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-center">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading personnel registry...
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">{u.full_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.username}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : u.role === 'EXAM_STAFF'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className="px-2.5 py-1 text-[11px] rounded-md font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Staff Modal */}
      <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Provision Staff Account">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Rajesh Kumar"
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Staff Username</label>
            <input
              type="text"
              required
              placeholder="e.g. rkumar"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Institutional Email</label>
            <input
              type="email"
              required
              placeholder="e.g. rkumar@college.edu"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role Permissions</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
            >
              <option value="EXAM_STAFF">Examination Staff (Operations & Processing)</option>
              <option value="ADMIN">Chief Administrator (Full Access)</option>
              <option value="VIEWER">Auditor / Department Observer (Read-Only)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer"
            >
              Provision Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
