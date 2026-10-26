import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import type { ResultPdfItem } from '../types';

export const PdfManagement: React.FC = () => {
  const [pdfs, setPdfs] = useState<ResultPdfItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search.trim()) params.append('search', search.trim());
      if (selectedStatus) params.append('status', selectedStatus);

      const data = await api.get<{ items: ResultPdfItem[]; total: number; total_pages: number }>(
        `/pdfs?${params.toString()}`
      );
      setPdfs(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, [page, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPdfs();
  };

  const handleDownload = (pdfId: number, filename: string) => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/pdfs/${pdfId}/download`;

    // Fetch as blob with auth header
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="p-8 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Verified Marksheet PDF Repository</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Audited examination marksheets, cryptographic SHA-256 integrity hashes, and secure authorized downloads.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Register Number or Student Name..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Verification Statuses</option>
            <option value="EXTRACTED">Extracted & Verified</option>
            <option value="PENDING">Pending Verification</option>
            <option value="FAILED">Extraction Failed</option>
            <option value="MISMATCH">Data Mismatch</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Register Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Document File Name</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4 text-center">Extraction Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading PDF records...
                  </td>
                </tr>
              ) : pdfs.length > 0 ? (
                pdfs.map((pdf, idx) => (
                  <tr
                    key={pdf.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{pdf.register_number}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{pdf.student_name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate max-w-[200px]">{pdf.file_name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {(pdf.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400" title={pdf.file_hash}>
                      {pdf.file_hash.substring(0, 16)}...
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pdf.extraction_status === 'EXTRACTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : pdf.extraction_status === 'MISMATCH'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {pdf.extraction_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDownload(pdf.id, pdf.file_name)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Download PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No PDF records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing <span className="font-semibold text-slate-800">{pdfs.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> documents
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
