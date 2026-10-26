import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Filter
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PdfViewerModal } from '../components/PdfViewerModal';
import { CustomDropdown } from '../components/CustomDropdown';
import type { ResultPdfItem } from '../types';

export const PdfManagement: React.FC = () => {
  const { success, error: toastError, info } = useToast();
  const [pdfs, setPdfs] = useState<ResultPdfItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');

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
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch marksheet PDF repository.');
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

  const handlePreview = (pdfId: number, filename: string) => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/pdfs/${pdfId}/download`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Preview fetch failed');
        return res.blob();
      })
      .then((blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        setPreviewPdfUrl(objectUrl);
        setPreviewFileName(filename);
        info(`Opening ${filename} in secure preview viewer`);
      })
      .catch((err) => toastError(err.message));
  };

  const handleDownload = (pdfId: number, filename: string) => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/pdfs/${pdfId}/download`;

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
        success(`Downloaded marksheet: ${filename}`);
      })
      .catch((err) => toastError(err.message));
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    info(`Copied SHA-256 hash to clipboard!`);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Cryptographic PDF Repository
              </span>
              <span className="text-slate-400 text-xs">• Total Marksheets: <strong className="text-white">{total}</strong></span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight font-heading text-white">
              Marksheet PDF Management & Verification
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Official provisional marksheets generated with ReportLab, extracted with pdfplumber, and sealed with SHA-256 cryptographic hashes.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search marksheet by Register Number..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium transition-all"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Verification Statuses</option>
            <option value="VERIFIED">Verified (Clean)</option>
            <option value="FLAGGED">Flagged / Ambiguous</option>
            <option value="PARSED">Parsed (Pending Verification)</option>
          </select>
        </div>
      </div>

      {/* PDF List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
              <tr>
                <th className="py-3.5 px-4">Marksheet Document</th>
                <th className="py-3.5 px-4">Register Number</th>
                <th className="py-3.5 px-4">Candidate Name</th>
                <th className="py-3.5 px-4 text-center">Session</th>
                <th className="py-3.5 px-4">SHA-256 File Checksum</th>
                <th className="py-3.5 px-4 text-center">Verification Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-600">Loading marksheet records...</span>
                    </div>
                  </td>
                </tr>
              ) : pdfs.length > 0 ? (
                pdfs.map((pdf, idx) => (
                  <tr
                    key={pdf.id}
                    className={`hover:bg-blue-50/40 transition-colors group ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{pdf.file_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{pdf.register_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{pdf.student_name}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700 font-mono text-[11px]">
                      Session #{pdf.session_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span title={pdf.file_hash}>
                          {pdf.file_hash ? `${pdf.file_hash.substring(0, 14)}...` : 'N/A'}
                        </span>
                        {pdf.file_hash && (
                          <button
                            onClick={() => copyHash(pdf.file_hash)}
                            title="Copy SHA-256 Hash"
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity p-0.5 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {pdf.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>Flagged</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePreview(pdf.id, pdf.file_name)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleDownload(pdf.id, pdf.file_name)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <h4 className="text-sm font-bold text-slate-700">No Marksheets Found</h4>
                      <p className="text-xs text-slate-400">
                        No marksheet PDFs match your search query. Run the automation pipeline to synthesize provisional marksheets.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/60">
          <div>
            Showing <strong className="text-slate-800">{pdfs.length}</strong> of{' '}
            <strong className="text-slate-800">{total}</strong> total documents
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="font-bold text-slate-700 px-2">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={Boolean(previewPdfUrl)}
        onClose={() => {
          if (previewPdfUrl) window.URL.revokeObjectURL(previewPdfUrl);
          setPreviewPdfUrl(null);
        }}
        pdfUrl={previewPdfUrl}
        fileName={previewFileName}
      />
    </div>
  );
};
