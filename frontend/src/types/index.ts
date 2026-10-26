export type Role = 'ADMIN' | 'EXAM_STAFF' | 'VIEWER';

export interface User {
  id: number;
  username: str;
  email: str;
  full_name: str;
  role: Role;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export type str = string;

export interface ExamSession {
  id: number;
  session_code: string;
  session_name: string;
  academic_year: string;
  semester_type: 'ODD' | 'EVEN';
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
}

export interface Student {
  id: number;
  register_number: string;
  name: string;
  department_code: string;
  batch: string;
  current_semester: number;
  section: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

export interface SubjectColumn {
  code: string;
  name: string;
  credits: number;
}

export interface StudentMatrixRow {
  student_id: number;
  register_number: string;
  student_name: string;
  department_code: string;
  batch: string;
  semester: number;
  grades: Record<string, string>;
  subject_statuses: Record<string, string>;
  gpa: number;
  result_status: 'PASS' | 'FAIL' | 'WITHHELD' | 'PENDING';
  arrears_count: number;
  standing_arrears_count: number;
  is_verified: boolean;
}

export interface ResultMatrix {
  session_code: string;
  department_code?: string;
  columns: SubjectColumn[];
  rows: StudentMatrixRow[];
  total_students: number;
  passed_students: number;
  failed_students: number;
  pass_percentage: number;
  average_gpa: number;
}

export interface AutomationJobLog {
  id: number;
  register_number: string;
  student_name?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRIED' | 'SKIPPED';
  stage: string;
  message: string;
  error_details?: string;
  pdf_path?: string;
  retry_count: number;
  timestamp: string;
}

export interface AutomationJob {
  id: string;
  session_id: number;
  session_code?: string;
  department_code?: string;
  batch?: string;
  semester?: number;
  job_type: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';
  total_records: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  error_summary?: string;
  initiated_by: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  logs: AutomationJobLog[];
}

export interface ResultPdfItem {
  id: number;
  student_id: number;
  student_name: string;
  register_number: string;
  session_id: number;
  file_name: string;
  file_size: number;
  file_hash: string;
  is_verified: boolean;
  extraction_status: 'PENDING' | 'EXTRACTED' | 'FAILED' | 'MISMATCH';
  created_at: string;
}

export interface ExcelReportItem {
  id: number;
  session_id: number;
  session_code?: string;
  department_code?: string;
  batch?: string;
  semester?: number;
  report_name: string;
  file_size: number;
  total_students: number;
  total_subjects: number;
  pass_percentage: number;
  is_valid: boolean;
  validation_notes?: string;
  generated_by: string;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  username: string;
  action: string;
  target_entity?: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  status: string;
  timestamp: string;
}

export interface DashboardStats {
  total_eligible_students: number;
  results_retrieved: number;
  results_verified: number;
  pending_records: number;
  failed_records: number;
  missing_ambiguous_results: number;
  latest_session?: string;
  latest_session_id?: number;
  recent_activities: {
    id: number;
    action: string;
    username: string;
    target?: string;
    status: string;
    timestamp: string;
  }[];
  latest_excel_export?: {
    id: number;
    report_name: string;
    created_at: string;
    pass_percentage: number;
    total_students: number;
    generated_by: string;
  };
  system_health: {
    status: string;
    database: string;
    storage_free_gb: number;
    active_background_jobs: number;
    pdf_storage_dir: string;
    reports_storage_dir: string;
  };
}

export interface RankHolderItem {
  rank: number;
  student_id: number;
  register_number: string;
  student_name: string;
  department_code: string;
  batch: string;
  semester: number;
  gpa: number;
  earned_credits: number;
}

export interface AtRiskStudentItem {
  student_id: number;
  register_number: string;
  student_name: string;
  department_code: string;
  batch: string;
  semester: number;
  gpa: number;
  arrears_count: number;
  standing_arrears_count: number;
  failed_subjects: string[];
}

export interface RankAndRemedialData {
  session_code: string;
  department_code?: string;
  semester?: number;
  toppers: RankHolderItem[];
  at_risk: AtRiskStudentItem[];
  total_appeared: number;
  total_passed: number;
  total_at_risk: number;
}

export interface SubjectPerformanceItem {
  subject_code: string;
  subject_name: string;
  credits: number;
  appeared: number;
  passed: number;
  failed: number;
  pass_percentage: number;
  grades_count: Record<string, number>;
  performance_level: 'HIGH' | 'AVERAGE' | 'LOW';
}

export interface SubjectPerformanceData {
  session_code: string;
  department_code?: string;
  semester?: number;
  subjects: SubjectPerformanceItem[];
  overall_pass_percentage: number;
}

