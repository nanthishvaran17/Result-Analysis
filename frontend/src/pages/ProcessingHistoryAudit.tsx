import React, { useEffect, useState } from 'react';
import {
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { api } from '../api/client';
import { CustomDropdown } from '../components/CustomDropdown';
import type { AuditLogItem } from '../types';

export const ProcessingHistoryAudit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
      });
      if (actionFilter) params.append('action', actionFilter);
      if (searchUser.trim()) params.append('username', searchUser.trim());

      const data = await api.get<{ items: AuditLogItem[]; total: number; total_pages: number }>(
        `/audit?${params.toString()}`
      );
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail & Processing History</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable logging of staff actions, automation execution events, result verification, and report exports.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder="Search by Staff Username..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </form>

        <div className="w-56">
          <CustomDropdown
            value={actionFilter}
            onChange={(val) => {
              setActionFilter(val);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Action Types' },
              { value: 'LOGIN', label: 'Login & Session', badge: 'AUTH' },
              { value: 'TRIGGER_AUTOMATION', label: 'Automation Runs', badge: 'ROBOT' },
              { value: 'VERIFY_RESULT', label: 'Result Verification', badge: 'VERIFY' },
              { value: 'GENERATE_EXCEL_REPORT', label: 'Excel Exports', badge: 'EXCEL' },
              { value: 'IMPORT_STUDENTS', label: 'Student Imports', badge: 'DATA' },
              { value: 'DOWNLOAD', label: 'Downloads', badge: 'EXPORT' },
            ]}
            icon={Filter}
            size="sm"
            placeholder="Filter Actions..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Target Entity / Details</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-500">#{log.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{log.username}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[320px] truncate" title={log.details || ''}>
                      {log.details || log.target_id || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No audit records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing <span className="font-semibold text-slate-800">{logs.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> recorded events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
