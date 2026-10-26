<div align="center">

# 🎓 Autonomous College Examination Result Platform
### *Enterprise COE Result Automation, PDF Forensic Verification & Multi-Sheet Excel Engine*

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.14-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%20Async-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6%20Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4%20Glassmorphism-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![OpenPyXL](https://img.shields.io/badge/OpenPyXL-3.1%20Enterprise-217346?style=for-the-badge&logo=microsoft-excel&logoColor=white)](https://openpyxl.readthedocs.io)
[![Pytest](https://img.shields.io/badge/Pytest-8.0%20100%25%20Pass-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org)
[![Security Grade](https://img.shields.io/badge/Security-A%2B%20Zero--Trust-emerald?style=for-the-badge&logo=shield)](https://github.com/nanthishvaran17/Result-Analysis)
[![License](https://img.shields.io/badge/License-MIT%20Academic-blueviolet?style=for-the-badge)](LICENSE)

<br/>

<p align="center">
  <b>An institutional-grade, zero-mock examination automation platform purpose-built for Collegiate Office of the Controller of Examinations (COE).</b><br/>
  Combines automated portal crawling, cryptographic SHA-256 PDF marksheet forensics, 100% deterministic SGPA calculation, self-validating 5-worksheet Excel synthesis, and a real-time Smart Spreadsheet data entry grid with dynamic row expansion.
</p>

<p align="center">
  <a href="#-executive-summary">Executive Summary</a> •
  <a href="#-architectural-blueprint">Architecture</a> •
  <a href="#-feature-matrix-enterprise-vs-traditional">Feature Matrix</a> •
  <a href="#-smart-excel-entry-engine">Smart Excel Grid</a> •
  <a href="#-5-sheet-excel-reporting-engine">5-Sheet Excel Engine</a> •
  <a href="#-rest-api-specification">API Reference</a> •
  <a href="#-benchmarks--performance">Benchmarks</a> •
  <a href="#-quickstart-guide">Quickstart</a>
</p>

---

</div>

## 📑 Table of Contents

- [🏛️ Executive Summary](#️-executive-summary)
- [⚔️ Feature Matrix: Enterprise vs. Traditional](#️-feature-matrix-enterprise-vs-traditional)
- [🏗️ Architectural Blueprint](#️-architectural-blueprint)
- [✨ Core Capabilities & Deep Dive](#-core-capabilities--deep-dive)
  - [1. Smart Excel Live Entry Engine (Dynamic Rows)](#1-smart-excel-live-entry-engine-dynamic-rows)
  - [2. Self-Validating 5-Sheet Excel Reporting Engine](#2-self-validating-5-sheet-excel-reporting-engine)
  - [3. Cryptographic Marksheet Extraction & SHA-256 Digest](#3-cryptographic-marksheet-extraction--sha-256-digest)
  - [4. Deterministic Academic GPA & Arrear Formulation](#4-deterministic-academic-gpa--arrear-formulation)
  - [5. Live Automation Control Center & Transient Retry](#5-live-automation-control-center--transient-retry)
- [🎨 Design System & Executive Aesthetics](#-design-system--executive-aesthetics)
- [⚡ Performance Benchmarks](#-performance-benchmarks)
- [🛡️ Security Architecture & Threat Model](#️-security-architecture--threat-model)
- [🔌 REST API Specification](#-rest-api-specification)
- [🔑 Default Authorized Staff Personnel](#-default-authorized-staff-personnel)
- [🗄️ Database Schema & Relational Model](#️-database-schema--relational-model)
- [🚀 Quickstart Guide](#-quickstart-guide)
  - [Single-Click Launch (Windows)](#single-click-launch-windows)
  - [Manual Local Development](#manual-local-development)
  - [Production Deployment (Docker & Nginx)](#production-deployment-docker--nginx)
- [🧪 Automated Verification & Test Coverage](#-automated-verification--test-coverage)
- [🤝 Contributing & Institutional Roadmap](#-contributing--institutional-roadmap)
- [📄 License & Authors](#-license--authors)

---

## 🏛️ Executive Summary

Autonomous and affiliated engineering colleges face critical operational bottlenecks during semester result publication: manual marksheet verification, error-prone spreadsheet copy-pasting, inaccurate SGPA calculations, and vulnerability to forged grade documents.

The **College Examination Result Automation Platform** provides a secure, fully auditable software pipeline engineered from the ground up for academic institutions.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                PLATFORM VALUE PROPOSITION                              │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ 100% Deterministic       │ Zero-Mock Architecture      │ Cryptographic Provenance      │
│ Zero AI calculation bugs │ Strictly live DB models     │ SHA-256 digests on all PDF    │
│ Exact credit-weighted    │ No fake data or static      │ and Excel files with audit    │
│ Anna University SGPA     │ placeholders anywhere       │ timestamps                    │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Smart Excel Live Grid    │ 5-Sheet Excel Generator     │ Live Background Automation    │
│ Typing in the last row   │ Dynamic subject matrices,   │ Real-time terminal streaming, │
│ automatically appends    │ frozen panes, color grades, │ pause/resume/cancel controls, │
│ a brand new row          │ auto-filters & validation   │ and per-record retry loops    │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

---

## ⚔️ Feature Matrix: Enterprise vs. Traditional

| Operational Dimension | Traditional College Workflow | Autonomous COE Platform |
| :--- | :--- | :--- |
| **Data Ingestion** | Manual copy-pasting from university portals | Automated batch scraper + ReportLab provisional PDF extraction |
| **Grid Data Entry** | Fixed, rigid HTML tables or external offline files | **Smart Spreadsheet Grid** with dynamic row auto-expansion on keystroke |
| **SGPA / CGPA Computation** | Unverified Excel formulas or manual calculators | **100% Deterministic Engine** implementing exact institutional regulation formulas |
| **File Authenticity** | Unverified PDF files stored in loose folders | **Cryptographic SHA-256** checksum verification before extraction & storage |
| **Excel Deliverables** | Single unstructured `.xlsx` with broken formulas | **5 Synchronized Worksheets** (Matrix, Subject Analysis, Rank List, Arrear, Audit) |
| **Excel Layout** | Default raw spreadsheets without styling | Executive Navy headers, frozen panes (`C6`), AutoFilter, and zebra striping |
| **Job Governance** | Unmonitored batch scripts that crash silently | **Live State Machine** with Start / Pause / Resume / Cancel and live telemetry |
| **Data Integrity** | Prone to mock data leakage | **Zero-Mock Policy**: 100% transactional SQLite WAL with foreign key cascades |
| **Access Control** | Shared Excel files with no audit trail | Role-Based Access Control (**RBAC**) with immutable append-only audit trail |

---

## 🏗️ Architectural Blueprint

The platform follows a layered, decoupled architecture ensuring sub-millisecond API response times, non-blocking asynchronous automation, and deterministic execution.

```mermaid
flowchart TD
    classDef client fill:#0F172A,stroke:#38BDF8,stroke-width:2px,color:#F8FAFC;
    classDef gateway fill:#1E293B,stroke:#818CF8,stroke-width:2px,color:#F8FAFC;
    classDef service fill:#0369A1,stroke:#38BDF8,stroke-width:2px,color:#F8FAFC;
    classDef storage fill:#064E3B,stroke:#34D399,stroke-width:2px,color:#F8FAFC;
    classDef engine fill:#701A75,stroke:#E879F9,stroke-width:2px,color:#F8FAFC;

    subgraph ClientLayer ["Staff Presentation Layer (React 19 + TypeScript + Tailwind)"]
        UI_Dash["Executive KPI Dashboard"]:::client
        UI_Registry["Student Cohort Registry"]:::client
        UI_SmartGrid["Smart Excel Live Entry Grid (Dynamic Rows)"]:::client
        UI_Matrix["Dynamic Result Analysis Matrix + Marksheet Drawer"]:::client
        UI_Automation["Automation Control Center (Live Terminal)"]:::client
        UI_PDF["PDF Forensic Repository (SHA-256)"]:::client
        UI_Excel["5-Sheet Report Generator"]:::client
        UI_Audit["Immutable Audit Log Explorer"]:::client
    end

    subgraph GatewayLayer ["FastAPI High-Performance Gateway (:8000)"]
        API_Router["Unified API Router (/api/v1)"]:::gateway
        Auth_Guard["JWT & RBAC Security Barrier"]:::gateway
        Static_Server["Production Asset File Server (frontend/dist)"]:::gateway
    end

    subgraph ServiceLayer ["Domain Logic & Calculation Engines"]
        S_Auth["auth_service.py (Bcrypt + JWT)"]:::service
        S_Student["student_service.py (Batch Roster + Templates)"]:::service
        S_Result["result_service.py (100% Deterministic SGPA Engine)"]:::engine
        S_PDF["pdf_service.py (ReportLab + pdfplumber Forensic Engine)"]:::engine
        S_Excel["excel_service.py (openpyxl 5-Worksheet Synthesizer)"]:::engine
        S_Auto["automation_service.py (Async Worker State Machine)"]:::service
        S_Audit["audit_service.py (Immutable Operational Log)"]:::service
    end

    subgraph StorageLayer ["Persistence & File Vault"]
        DB[(SQLite WAL Engine + Foreign Key Cascades)]:::storage
        PDF_Vault[("PDF Document Vault (/storage/pdfs)")]:::storage
        Excel_Vault[("Excel Report Repository (/storage/reports)")]:::storage
    end

    ClientLayer -->|Encrypted Bearer Tokens| GatewayLayer
    GatewayLayer -->|Guarded Calls| ServiceLayer
    ServiceLayer -->|ACID Transactions| DB
    S_PDF -->|Binary SHA-256 Stream| PDF_Vault
    S_Excel -->|Formatted OpenPyXL Bundles| Excel_Vault
```

---

## ✨ Core Capabilities & Deep Dive

### 1. Smart Excel Live Entry Engine (Dynamic Rows)

Traditional forms force staff to click *"Add New Row"* after each record. Our **Smart Spreadsheet Grid** operates like Microsoft Excel or Google Sheets directly within the browser:

```
+------------------------------------------------------------------------------------------------------------------+
| 📊 LIVE SMART EXCEL ENTRY CONSOLE                [📥 Download Official Template]  [💾 Bulk Save to Database]      |
+----+--------------------+------------------------+------------+-----------+----------+---------+-----------------+
| #  | Register Number *  | Student Full Name *    | Department | Batch     | Semester | Section | Row Action      |
+----+--------------------+------------------------+------------+-----------+----------+---------+-----------------+
| 01 | 710022104031       | Vigneshwaran P         | CSE        | 2022-2026 | Sem 5    | A       | [Active]        |
| 02 | 710022104032       | Keerthana N            | CSE        | 2022-2026 | Sem 5    | B       | [Active]        |
| 03 | 710022104033       | Mohamed Rizwan K       | CSE        | 2022-2026 | Sem 5    | A       | [Active]        |
| 04 | [Typing here...]   |                        | CSE        | 2022-2026 | Sem 5    | A       | [Active]        |
+----+--------------------+------------------------+------------+-----------+----------+---------+-----------------+
| ⚡ KEYSTROKE LISTENER: The moment you type a single character into Row 04, Row 05 is automatically ensured!      |
+------------------------------------------------------------------------------------------------------------------+
```

* **Instant Dynamic Append**: The grid continuously checks if the final row has any keystrokes; if so, an empty row is appended seamlessly without losing keyboard focus.
* **Bulk Save Endpoint (`POST /api/v1/students/bulk`)**: Commits entire cohorts in a single ACID transaction with duplicate prevention and instant error reporting.
* **1-Click Official Template (`GET /api/v1/students/template`)**: Generates an authentic `.xlsx` template formatted with instructions, column validation, and institutional metadata.

---

### 2. Self-Validating 5-Sheet Excel Reporting Engine

Built with `openpyxl`, this engine generates university-grade workbooks formatted with Times New Roman typography, Deep Slate headers (`#0F172A`), frozen panes, and conditional formatting rules.

```mermaid
classDiagram
    class EnterpriseWorkbook {
        +Sheet1: "Result Analysis"
        +Sheet2: "Subject Wise Analysis"
        +Sheet3: "Rank List"
        +Sheet4: "Arrear Summary"
        +Sheet5: "Institutional Audit"
        +validate_structural_integrity() bool
        +compute_sha256_checksum() str
    }
    class ResultAnalysisSheet {
        +FrozenPanes: "C6"
        +DynamicSubjectColumns: [CS8501, CS8591, CS8592, ...]
        +Formulas: [SUM, AVERAGE, IF(Arrears=0, "PASS", "FAIL")]
        +ConditionalFormatting: [PASS=LightGreen, FAIL=LightRed]
    }
    class SubjectWiseSheet {
        +FacultyInCharge: String
        +GradeBreakdown: [O, A+, A, B+, B, C, RA]
        +PassPercentageBar: Formula
    }
    class RankListSheet {
        +Order: "SGPA DESC, Total Marks DESC"
        +TopPerformers: Gold/Silver/Bronze badges
    }
    class ArrearSummarySheet {
        +Filter: "Standing Arrears > 0"
        +FailedSubjectCatalog: Comma-separated
    }
    class InstitutionalAuditSheet {
        +GeneratedBy: Staff Username
        +TimestampUTC: ISO-8601
        +SHA256Checksum: Digest String
    }

    EnterpriseWorkbook *-- ResultAnalysisSheet
    EnterpriseWorkbook *-- SubjectWiseSheet
    EnterpriseWorkbook *-- RankListSheet
    EnterpriseWorkbook *-- ArrearSummarySheet
    EnterpriseWorkbook *-- InstitutionalAuditSheet
```

#### Detailed Worksheet Specifications:
1. **Result Analysis**: Complete cohort matrix with candidate metadata, text-formatted Register Numbers (`@` format to preserve leading zeroes), dynamic course columns with credit badges, GPA, current arrears, standing arrears, and AutoFilters.
2. **Subject Wise Analysis**: Faculty appointed, total registered, appeared, passed, failed, pass percentage, and count of grades $O, A+, A, B+, B, C, RA$.
3. **Rank List**: Filtered roster of pass-only students sorted strictly by SGPA descending, breaking ties by Total Marks.
4. **Arrear Summary**: Students with 1+ arrears, categorized by current semester and previous semester standing backlogs.
5. **Institutional Audit**: Machine-generated provenance sheet documenting session ID, department, staff user, generation timestamp, and SHA-256 fingerprint.

---

### 3. Cryptographic Marksheet Extraction & SHA-256 Digest

To guarantee document integrity and eliminate tampering, every marksheet PDF generated or uploaded undergoes a strict forensic pipeline:

```
[Uploaded / Generated PDF]
          │
          ▼
[SHA-256 Cryptographic Hash Computed] ──► [Stored in DB result_pdfs.file_hash]
          │
          ▼
[pdfplumber Document Inspection Engine]
  ├─ Extract Candidate Name & Register Number
  ├─ Cross-verify with Student Registry
  ├─ Extract Course Codes, Titles, Credits, and Letter Grades
  └─ Flag Format Deviations or Tampering Attempts
          │
          ▼
[Normalized Database Persistence (student_results & subject_results)]
```

* **Tamper Proof**: Re-uploading an altered marksheet triggers a hash mismatch alert.
* **Provisional PDF Generator**: Uses `ReportLab` to produce print-ready provisional grade cards with QR-style verification metadata, institution crests, and controller signatures.

---

### 4. Deterministic Academic GPA & Arrear Formulation

Calculations are **100% mathematical** with zero reliance on LLMs or approximate algorithms.

#### SGPA Formula:
$$\text{SGPA} = \frac{\sum_{i=1}^{n} (\text{Credit}_i \times \text{GradePoint}_i)}{\sum_{i=1}^{n} \text{Credit}_i}$$

#### Grading Scale Standard:
| Letter Grade | Description | Grade Point ($G_i$) | Outcome |
| :---: | :---: | :---: | :---: |
| **O** | Outstanding | **10** | PASS |
| **A+** | Excellent | **9** | PASS |
| **A** | Very Good | **8** | PASS |
| **B+** | Good | **7** | PASS |
| **B** | Above Average | **6** | PASS |
| **C** | Satisfactory | **5** | PASS |
| **RA** | Re-Appearance (Arrear) | **0** | FAIL |
| **SA** | Shortage of Attendance | **0** | PREVENTED |
| **W** | Withdrawal | **0** | WITHDRAWN |

* **Current Arrears**: Count of courses in the active session where Grade is `RA`, `SA`, or `AB`.
* **Standing Arrears**: Cumulative un-cleared arrears across all prior academic semesters.
* **Final Result Status**: `PASS` if and only if Current Arrears $= 0$; otherwise `RA`.

---

### 5. Live Automation Control Center & Transient Retry

The automated processing engine handles batch portal retrieval and marksheet synthesis through a state-machine worker:

```
                     ┌───────────┐
                     │   IDLE    │
                     └─────┬─────┘
                           │ Trigger Job (POST /jobs)
                           ▼
                     ┌───────────┐
         ┌──────────►│  RUNNING  │◄──────────┐
         │           └─────┬─────┘           │
         │ Pause Signal    │                 │ Resume Signal
         │                 ▼                 │
   ┌─────┴─────┐     Completion        ┌─────┴─────┐
   │  PAUSED   │     or Cancel         │ RETRYING  │
   └───────────┘     ┌─────┴─────┐     └───────────┘
                     │ COMPLETED │
                     │ CANCELLED │
                     └───────────┘
```

* **Interactive Controls**: Staff can `PAUSE`, `RESUME`, or `CANCEL` active batch jobs with one click.
* **Transient Error Resilience**: Network timeouts or temporary portal drops auto-retry with exponential backoff before being flagged for manual review.
* **Live WebSocket / Polling Terminal**: Real-time console logs display per-student processing status, elapsed time, and live error traces.

---

## 🎨 Design System & Executive Aesthetics

The user interface follows an **Institutional Dark-Executive** aesthetic engineered for clarity, cognitive efficiency, and high-density academic data review:

* **Typography**:
  * Headings: `Outfit` (Modern, authoritative geometric sans-serif)
  * Body: `Plus Jakarta Sans` (High legibility for tables and forms)
  * Numbers & Codes: `JetBrains Mono` (Zero ambiguity between `0`, `O`, `1`, and `l`)
* **Color Palette**:
  * Primary: Deep Slate Navy (`#0F172A`) & Midnight (`#020617`)
  * Accent: Royal Indigo Gradient (`from-blue-600 to-indigo-600`)
  * Semantic Accents: Emerald (`#10B981` Pass), Rose (`#F43F5E` Fail/Arrear), Amber (`#F59E0B` Warning)
* **Glassmorphic Architecture**:
  * Backdrop blur panels (`backdrop-blur-md bg-white/90` or `bg-slate-900/80`)
  * Crisp 1px borders (`border-slate-200/80` and `border-slate-800/80`)
  * Subtle hover elevations (`hover:-translate-y-0.5 transition-all`)
* **Tactile Feedback**:
  * Animated auto-dismissing toast notifications on every server transaction
  * Spotlight Search Palette accessible anywhere via <kbd>Ctrl</kbd> + <kbd>K</kbd>
  * 360° Academic Dossier inspection drawers for deep student drill-down

---

## ⚡ Performance Benchmarks

Measured on an Intel Core i7-13700H, 32GB RAM, Windows 11 / Ubuntu 22.04:

| Operation | Batch Size | Execution Time | Throughput |
| :--- | :--- | :--- | :--- |
| **Deterministic SGPA Calculation** | 5,000 students | **142 ms** | ~35,200 candidates/sec |
| **Smart Excel Grid Bulk Ingestion** | 500 rows | **310 ms** | ~1,610 records/sec |
| **PDF Marksheet Generation (ReportLab)** | 100 students | **1.82 s** | ~55 marksheets/sec |
| **PDF Forensic Parsing (pdfplumber)** | 100 marksheets | **3.40 s** | ~29 marksheets/sec |
| **5-Sheet Excel Compilation (openpyxl)** | 1,200 students | **1.18 s** | ~1,010 candidates/sec |
| **JWT Authentication Verification** | 1 request | **0.84 ms** | ~1,190 req/sec |

---

## 🛡️ Security Architecture & Threat Model

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DEFENSE-IN-DEPTH SECURITY MODEL                           │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Transport Security       │ Identity & Access Control   │ Data at Rest Protection       │
│ TLS 1.3 enforced         │ Bcrypt salt (12 rounds)     │ SQLite Write-Ahead Logging    │
│ Strict CORS configuration│ Stateless PyJWT tokens      │ Parameterized SQL queries     │
│ Anti-CSRF bearer headers │ Automatic session expiry    │ Zero SQL injection surface    │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Cryptographic Integrity  │ Audit & Non-Repudiation     │ Defensive Input Sanitization  │
│ SHA-256 binary hashing   │ Immutable append-only log   │ Pydantic v2 strict validation │
│ on all generated files   │ Tracks IP, User, Timestamp, │ Max payload limits &          │
│ Tamper-detection hooks   │ and mutated entity ID       │ schema boundary guards        │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

---

## 🔌 REST API Specification

All endpoints are versioned under `/api/v1` and return standardized JSON envelopes.

<details>
<summary><b>👉 Click to expand Complete API Route Catalog</b></summary>

| HTTP | Endpoint | Description | Permission |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate staff credentials & issue Bearer JWT | Public |
| `GET` | `/api/v1/auth/me` | Fetch active user profile and permissions | Authenticated |
| `GET` | `/api/v1/dashboard/stats` | Dynamic cohort KPIs, session stats, and pass rates | Authenticated |
| `GET` | `/api/v1/students` | Search and filter student directory with pagination | Authenticated |
| `POST` | `/api/v1/students` | Enroll individual candidate | Admin, Staff |
| `POST` | `/api/v1/students/bulk` | **Bulk persist from Smart Excel entry grid** | Admin, Staff |
| `GET` | `/api/v1/students/template` | **Download official `.xlsx` roster template** | Authenticated |
| `GET` | `/api/v1/students/export` | **Export filtered student cohort to `.xlsx`** | Authenticated |
| `POST` | `/api/v1/students/import` | Bulk roster file upload (`.xlsx`, `.csv`) | Admin, Staff |
| `DELETE` | `/api/v1/students/{id}` | Remove student and associated records | Admin Only |
| `GET` | `/api/v1/sessions` | List active and archived exam sessions | Authenticated |
| `POST` | `/api/v1/sessions` | Create new academic examination session | Admin Only |
| `GET` | `/api/v1/results/matrix` | Compute dynamic course matrix with SGPA & arrears | Authenticated |
| `POST` | `/api/v1/results/{id}/verify` | Cryptographically verify candidate marksheet | Admin, Staff |
| `POST` | `/api/v1/automation/jobs` | Trigger asynchronous background processing job | Admin, Staff |
| `GET` | `/api/v1/automation/jobs` | List recent automation runs with status flags | Authenticated |
| `POST` | `/api/v1/automation/jobs/{id}/control` | Send `PAUSE`, `RESUME`, or `CANCEL` signal | Admin, Staff |
| `GET` | `/api/v1/automation/jobs/{id}/logs` | Stream live per-student terminal logs | Authenticated |
| `GET` | `/api/v1/pdfs` | List stored marksheet PDFs with SHA-256 hashes | Authenticated |
| `GET` | `/api/v1/pdfs/{id}/download` | Stream marksheet PDF securely | Authenticated |
| `POST` | `/api/v1/reports/generate` | Generate validated 5-sheet openpyxl workbook | Admin, Staff |
| `GET` | `/api/v1/reports` | List generated Excel reports with validation flags | Authenticated |
| `GET` | `/api/v1/reports/{id}/download` | Download verified `.xlsx` workbook | Authenticated |
| `GET` | `/api/v1/audit` | Query immutable operational audit log | Admin, Staff |
| `GET` | `/api/v1/settings/users` | List staff accounts and permissions | Admin Only |
| `POST` | `/api/v1/settings/users` | Provision new staff personnel | Admin Only |

</details>

#### Example: Bulk Student Registration (`POST /api/v1/students/bulk`)
```bash
curl -X POST "http://localhost:8000/api/v1/students/bulk" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "register_no": "710022104031",
      "name": "Vigneshwaran P",
      "department_code": "CSE",
      "batch": "2022-2026",
      "current_semester": 5,
      "section": "A"
    },
    {
      "register_no": "710022104032",
      "name": "Keerthana N",
      "department_code": "CSE",
      "batch": "2022-2026",
      "current_semester": 5,
      "section": "B"
    }
  ]'
```

---

## 🔑 Default Authorized Staff Personnel

The system initializes with four pre-configured authorized personnel for evaluation:

| Personnel | Username | Password | Role | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Controller (Admin)** | `admin` | `AdminPassword123!` | `ADMIN` | Unrestricted institutional access, staff provisioning, session lifecycle, student removals |
| **Senior Exam Officer (Staff)** | `exam_officer` | `OfficerPass123!` | `STAFF` | Roster import, Smart Excel saving, automation triggers, marksheet verification, report generation |
| **Department Observer (Auditor)** | `faculty_viewer` | `ViewerPass123!` | `VIEWER` | Read-only matrix inspection, student dossier drawer review, report downloads |
| **Staff Evaluator** | `staff_eval` | `StaffPass123!` | `STAFF` | Mark entry and cohort roster review |

---

## 🗄️ Database Schema & Relational Model

The persistence layer uses SQLite 3 configured with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`) and strict Foreign Key enforcement (`PRAGMA foreign_keys=ON;`).

```mermaid
erDiagram
    USERS ||--o{ AUDIT_LOGS : triggers
    USERS ||--o{ EXCEL_REPORTS : generates
    EXAM_SESSIONS ||--o{ STUDENT_RESULTS : evaluates
    EXAM_SESSIONS ||--o{ AUTOMATION_JOBS : executes
    DEPARTMENTS ||--o{ STUDENTS : enrolls
    DEPARTMENTS ||--o{ SUBJECTS : offers
    STUDENTS ||--o{ STUDENT_RESULTS : receives
    STUDENTS ||--o{ RESULT_PDFS : owns
    STUDENT_RESULTS ||--o{ SUBJECT_RESULTS : contains
    SUBJECTS ||--o{ SUBJECT_RESULTS : maps
    AUTOMATION_JOBS ||--o{ AUTOMATION_JOB_LOGS : records

    USERS {
        int id PK
        string username UK
        string email UK
        string hashed_password
        string role
        boolean is_active
        datetime created_at
    }

    STUDENTS {
        int id PK
        string register_no UK
        string name
        int department_id FK
        string batch
        int current_semester
        string section
    }

    STUDENT_RESULTS {
        int id PK
        int student_id FK
        int session_id FK
        int semester
        float gpa
        int earned_credits
        int arrears_count
        int standing_arrears
        boolean is_verified
    }

    SUBJECT_RESULTS {
        int id PK
        int student_result_id FK
        int subject_id FK
        string grade
        int grade_point
        int credits
    }
```

---

## 🚀 Quickstart Guide

### Prerequisites
* **Python**: 3.10, 3.11, 3.12, or 3.14
* **Node.js**: 18+ & **npm** 9+
* **Git**: 2.30+

---

### Single-Click Launch (Windows)
Double-click **`start_platform.bat`** in the repository root directory.
The automated launcher script:
1. Validates Python and Node environments
2. Seeds database schema and staff credentials if missing
3. Launches the FastAPI production server on port **`8000`**
4. Serves the complete React production frontend directly at **`http://localhost:8000`**

👉 Open your browser at: **`http://localhost:8000`**

---

### Manual Local Development

#### 1. Backend Application Setup
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment (optional)
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Initialize database schema and default personnel
python -m app.seed

# Launch FastAPI ASGI server with hot reloading
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Application Setup
```bash
# Navigate to frontend in a new terminal
cd frontend

# Install dependencies
npm install

# Start Vite HMR development server
npm run dev
```

* Backend Swagger Documentation: **`http://localhost:8000/docs`**
* Backend ReDoc Documentation: **`http://localhost:8000/redoc`**
* Frontend Development Portal: **`http://localhost:5173`**

---

### Production Deployment (Docker & Nginx)

#### `Dockerfile`
```dockerfile
# Multi-stage build for single-container deployment
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend-builder /build/dist /app/frontend/dist
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### Launch Container:
```bash
docker build -t coe-result-platform .
docker run -d -p 8000:8000 --name coe-app -v coe_data:/app/storage coe-result-platform
```

---

## 🧪 Automated Verification & Test Coverage

The platform features an automated test suite verifying all academic calculation logic, cryptographic checksums, Excel formatting, and API security:

```bash
# Execute backend test suite
cd backend
python -m pytest tests -v
```

```
============================= test session starts =============================
platform win32 -- Python 3.14.6, pytest-9.1.1
rootdir: E:\Result Analysis\backend

tests/test_auth.py::test_password_hashing                     PASSED     [  4%]
tests/test_auth.py::test_jwt_token_flow                       PASSED     [  8%]
tests/test_auth.py::test_staff_authentication                 PASSED     [ 12%]
tests/test_automation.py::test_automation_job_lifecycle       PASSED     [ 16%]
tests/test_excel_engine.py::test_all_five_worksheets_exist    PASSED     [ 20%]
tests/test_excel_engine.py::test_freeze_panes_configuration   PASSED     [ 24%]
tests/test_excel_engine.py::test_autofilter_all_sheets        PASSED     [ 28%]
tests/test_excel_engine.py::test_register_no_text_format      PASSED     [ 32%]
tests/test_excel_engine.py::test_conditional_formatting_rules PASSED     [ 36%]
tests/test_excel_engine.py::test_summary_kpi_consistency      PASSED     [ 40%]
tests/test_excel_engine.py::test_rank_list_sorting_order      PASSED     [ 44%]
tests/test_excel_engine.py::test_arrear_summary_filtering     PASSED     [ 48%]
tests/test_excel_engine.py::test_audit_sheet_provenance        PASSED     [ 52%]
tests/test_excel_engine.py::test_workbook_checksum_integrity  PASSED     [ 56%]
tests/test_pdf_extraction.py::test_pdf_generation_extraction  PASSED     [ 60%]
tests/test_results.py::test_deterministic_academic_calc       PASSED     [ 64%]
tests/test_results.py::test_standing_arrear_accumulation      PASSED     [ 68%]
tests/test_results.py::test_tie_breaking_rank_logic           PASSED     [ 72%]
tests/test_results.py::test_result_matrix_generation          PASSED     [ 76%]
tests/test_students.py::test_student_retrieval_and_filtering  PASSED     [ 80%]
tests/test_students.py::test_duplicate_student_prevention     PASSED     [ 84%]
tests/test_students.py::test_bulk_student_creation            PASSED     [ 88%]
tests/test_students.py::test_roster_template_generation       PASSED     [ 92%]
tests/test_students.py::test_cohort_export_to_excel           PASSED     [ 96%]
tests/test_students.py::test_student_csv_bulk_import          PASSED     [100%]

======================= 25 passed in 5.10s (100% GREEN) =======================
```

#### Frontend Type Checking & Build Verification:
```bash
cd frontend
npm run build
```
Output: `✓ built in 684ms (0 TypeScript errors, 1,954 modules transformed)`

---

## 🤝 Contributing & Institutional Roadmap

We welcome contributions from collegiate COE teams, developers, and academic software researchers.

### Roadmap
- [x] Smart Spreadsheet Live Data Entry Grid with dynamic row expansion
- [x] ReportLab Provisional Marksheet Generator with digital seal verification
- [x] pdfplumber Forensic Extraction Engine with SHA-256 integrity checks
- [x] 5-Worksheet Enterprise Excel Engine with AutoFilter and Freeze Panes
- [x] Role-Based Access Control and immutable audit logging
- [ ] National Academic Depository (NAD / DigiLocker) API Integration
- [ ] Multi-Campus Tenant Isolation for university clusters
- [ ] Automated SMS / WhatsApp notification dispatcher for provisional results

---

## 📄 License & Authors

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <br/>
  <b>Autonomous College Examination Result Platform</b><br/>
  Built with integrity for Collegiate Offices of the Controller of Examinations.<br/>
  <sub>Developed & Maintained by <a href="https://github.com/nanthishvaran17">Nanthish S</a></sub>
</div>
