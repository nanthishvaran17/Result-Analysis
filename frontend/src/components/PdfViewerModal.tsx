import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Globe, Printer, ExternalLink, ShieldCheck } from 'lucide-react';
import api from '../services/api';

interface CourseItem {
  code: string;
  name: string;
  grade: string;
  result: string;
  credits?: number;
}

interface MarksheetDetails {
  register_number: string;
  student_name: string;
  department_code: string;
  branch_name: string;
  batch: string;
  semester: number;
  year_of_passing: string;
  session_code: string;
  session_name: string;
  academic_year: string;
  courses: CourseItem[];
  gpa: number;
  result_status: string;
}

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  fileName: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  fileName,
}) => {
  const [activeTab, setActiveTab] = useState<'PORTAL' | 'PDF'>('PORTAL');
  const [details, setDetails] = useState<MarksheetDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !fileName) return;

    // Extract register number from filename (e.g. 710022104012_NOV_DEC_2025.pdf)
    const regNo = fileName.split('_')[0];
    if (regNo) {
      setLoading(true);
      api
        .get<MarksheetDetails>(`/pdfs/details/${regNo}`)
        .then((res) => {
          setDetails(res);
        })
        .catch(() => {
          setDetails(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, fileName]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-xl text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs tracking-wide text-white">{fileName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Official COE Result
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Nandha Engineering College (Autonomous) Official Marksheet</p>
            </div>
          </div>

          {/* Tab Switcher & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveTab('PORTAL')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'PORTAL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Official Web View</span>
              </button>
              <button
                onClick={() => setActiveTab('PDF')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'PDF'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Document</span>
              </button>
            </div>

            {activeTab === 'PORTAL' ? (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Print Official Marksheet"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            ) : (
              pdfUrl && (
                <a
                  href={pdfUrl}
                  download={fileName}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 print:p-0 print:bg-white">
          {activeTab === 'PORTAL' ? (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
              {/* Official Nandha College Portal Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-800 border border-blue-200 mb-2">
                  Autonomous Examination Results Notification
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#004A80] font-heading">
                  NANDHA ENGINEERING COLLEGE (AUTONOMOUS)
                </h1>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  (Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai • Accredited by NAAC with 'A+' Grade)
                </p>
                <p className="text-[11px] text-slate-500">
                  Pitchandampalayam (PO), Erode – 638 052, Tamil Nadu
                </p>
                <div className="mt-3 py-1.5 px-4 bg-[#004A80] text-white font-bold text-xs uppercase tracking-wider rounded-lg inline-block">
                  Office of the Controller of Examinations — End Semester Results
                </div>
              </div>

              {/* Student Header Detail Pills (Matches coe.nandhaengg.org/results/ 1:1) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
                {/* Register Number (Blue Pill #75BEF3) */}
                <div className="bg-[#75BEF3]/90 text-slate-900 rounded-xl p-3 border border-sky-300 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Register Number</div>
                  <div className="text-lg font-black tracking-tight mt-0.5 font-mono">
                    {details?.register_number || fileName.split('_')[0]}
                  </div>
                </div>

                {/* Name (Orange Pill #FFD9AD) */}
                <div className="bg-[#FFD9AD]/90 text-slate-900 rounded-xl p-3 border border-amber-300 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Student Name</div>
                  <div className="text-lg font-black tracking-tight mt-0.5 uppercase">
                    {details?.student_name || 'STUDENT NAME'}
                  </div>
                </div>

                {/* Year of Passing (Blue Pill #75BEF3) */}
                <div className="bg-[#75BEF3]/90 text-slate-900 rounded-xl p-3 border border-sky-300 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Year Of Passing</div>
                  <div className="text-base font-bold tracking-tight mt-0.5">
                    {details?.year_of_passing || 'Apr/May-2026'}
                  </div>
                </div>

                {/* Branch (Orange Pill #FFD9AD) */}
                <div className="bg-[#FFD9AD]/90 text-slate-900 rounded-xl p-3 border border-amber-300 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Branch</div>
                  <div className="text-xs sm:text-sm font-bold tracking-tight mt-0.5 uppercase leading-snug">
                    {details?.branch_name || 'B.E - COMPUTER SCIENCE AND ENGINEERING'}
                  </div>
                </div>
              </div>

              {/* Course Results Table (Exact Official Nandha Portal Palette & Styling) */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#004A80] text-white uppercase text-[11px] font-bold tracking-wider text-center">
                      <th className="py-2.5 px-4 border border-[#004A80] text-left">Course Code</th>
                      <th className="py-2.5 px-4 border border-[#004A80] text-left">Course Name</th>
                      <th className="py-2.5 px-3 border border-[#004A80] w-20">Credits</th>
                      <th className="py-2.5 px-3 border border-[#004A80] w-20">Grade</th>
                      <th className="py-2.5 px-3 border border-[#004A80] w-24">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details?.courses && details.courses.length > 0 ? (
                      details.courses.map((course, idx) => {
                        const isEven = idx % 2 === 0;
                        const isPass = course.result === 'PASS';
                        return (
                          <tr
                            key={course.code + idx}
                            className={`${isEven ? 'bg-white' : 'bg-[#E9F6FF]/70'} hover:bg-blue-50/60 transition-colors`}
                          >
                            <td className="py-2.5 px-4 border border-slate-200 font-mono font-bold text-slate-900">
                              {course.code}
                            </td>
                            <td className="py-2.5 px-4 border border-slate-200 font-medium text-slate-800">
                              {course.name}
                            </td>
                            <td className="py-2.5 px-3 border border-slate-200 text-center font-semibold text-slate-700">
                              {course.credits ?? 3}
                            </td>
                            <td className="py-2.5 px-3 border border-slate-200 text-center font-bold">
                              <span className={isPass ? 'text-emerald-700' : 'text-rose-700'}>
                                {course.grade}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 border border-slate-200 text-center font-bold">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${
                                  isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {course.result}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 font-medium">
                          {loading ? 'Retrieving official marksheet details...' : 'Course details unavailable.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Academic Performance Summary */}
              {details && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold">Semester GPA:</span>{' '}
                    <strong className="text-base text-[#004A80] font-black">{details.gpa.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Provisional Status:</span>{' '}
                    <span
                      className={`font-black uppercase px-2.5 py-1 rounded text-xs ${
                        details.result_status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {details.result_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Published By:</span>{' '}
                    <strong className="text-slate-800 font-bold">COE Autonomous Publication Wing</strong>
                  </div>
                </div>
              )}

              {/* Official Nandha Autonomous Grading Scale Matrix (1:1 with Portal) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-center text-[11px]">
                <div className="bg-slate-100 font-black text-slate-800 py-1.5 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  Academic Year 2025–2026 Onwards — Award of Grade Reference
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <tbody>
                      <tr className="bg-slate-50 font-bold text-slate-700">
                        <td className="p-1.5 border border-slate-200 font-semibold text-slate-600">Range of Marks</td>
                        <td className="p-1.5 border border-slate-200">91–100</td>
                        <td className="p-1.5 border border-slate-200">81–90</td>
                        <td className="p-1.5 border border-slate-200">71–80</td>
                        <td className="p-1.5 border border-slate-200">66–70</td>
                        <td className="p-1.5 border border-slate-200">61–65</td>
                        <td className="p-1.5 border border-slate-200">56–60</td>
                        <td className="p-1.5 border border-slate-200">50–55</td>
                        <td className="p-1.5 border border-slate-200">&lt;50</td>
                      </tr>
                      <tr className="bg-white font-bold text-slate-900">
                        <td className="p-1.5 border border-slate-200 font-semibold text-slate-600">Grade Point</td>
                        <td className="p-1.5 border border-slate-200 text-blue-700">10</td>
                        <td className="p-1.5 border border-slate-200 text-blue-700">9</td>
                        <td className="p-1.5 border border-slate-200 text-blue-700">8</td>
                        <td className="p-1.5 border border-slate-200 text-blue-700">7</td>
                        <td className="p-1.5 border border-slate-200 text-blue-700">6.5</td>
                        <td className="p-1.5 border border-slate-200 text-blue-700">6</td>
                        <td className="p-1.5 border border-slate-200 text-blue-700">5</td>
                        <td className="p-1.5 border border-slate-200 text-rose-600">0</td>
                      </tr>
                      <tr className="bg-slate-50 font-black text-slate-900">
                        <td className="p-1.5 border border-slate-200 font-semibold text-slate-600">Letter Grade</td>
                        <td className="p-1.5 border border-slate-200 text-emerald-700">S</td>
                        <td className="p-1.5 border border-slate-200 text-emerald-700">A+</td>
                        <td className="p-1.5 border border-slate-200 text-emerald-700">A</td>
                        <td className="p-1.5 border border-slate-200 text-emerald-700">B+</td>
                        <td className="p-1.5 border border-slate-200 text-emerald-700">B</td>
                        <td className="p-1.5 border border-slate-200 text-slate-700">C+</td>
                        <td className="p-1.5 border border-slate-200 text-slate-700">C</td>
                        <td className="p-1.5 border border-slate-200 text-rose-700">U / RA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Footnote / Verification Stamp */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticated Examination Record • Nandha Autonomous Portal</span>
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  Direct Source: coe.nandhaengg.org/results/
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full min-h-[500px]">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title={fileName}
                  className="w-full h-full min-h-[600px] rounded-xl border border-slate-300 shadow-inner bg-white"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  PDF document not available.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
