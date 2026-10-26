# Enterprise Examination Result Automation Platform

A complete, secure, professional, staff-friendly examination result automation and analytics platform for collegiate controller of examinations offices.

---

## 🏛️ Architecture Overview

```
e:/Result Analysis/
├── start_platform.bat               # Single-click launcher for the entire platform
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry point
│   │   ├── seed.py                  # Database initial seed script
│   │   ├── core/
│   │   │   ├── config.py            # Application settings & environment config
│   │   │   ├── database.py          # SQLAlchemy SQLite connection with WAL & FKs
│   │   │   └── security.py          # Direct bcrypt password hashing & JWT handling
│   │   ├── models/                  # Normalized database schemas
│   │   │   ├── user.py              # Staff accounts & RBAC roles
│   │   │   ├── session.py           # Examination sessions & semesters
│   │   │   ├── student.py           # Departments & Student cohort registry
│   │   │   ├── subject.py           # Subject definitions & syllabi
│   │   │   ├── result.py            # Normalized StudentResult & SubjectResult
│   │   │   ├── job.py               # Automation jobs & live execution logs
│   │   │   ├── pdf_record.py        # PDF metadata, SHA-256 hashes, & verification
│   │   │   ├── excel_report.py      # Generated 5-sheet workbooks & audit logs
│   │   │   └── audit.py             # Immutable staff activity logging
│   │   ├── schemas/                 # Pydantic v2 schemas for all requests/responses
│   │   ├── services/
│   │   │   ├── auth_service.py      # Authentication & user operations
│   │   │   ├── student_service.py   # Registry CRUD, duplicate detection, bulk import
│   │   │   ├── result_service.py    # Deterministic GPA & arrear calculations
│   │   │   ├── pdf_service.py       # Marksheet PDF generation & pdfplumber extraction
│   │   │   ├── automation_service.py# Job lifecycle runner (start/pause/resume/cancel)
│   │   │   ├── excel_service.py     # openpyxl 5-worksheet engine & self-validator
│   │   │   └── audit_service.py     # Immutable audit trails
│   │   └── api/v1/                  # RESTful API route modules
│   ├── storage/                     # Secure storage for PDFs, reports, and uploads
│   └── tests/                       # Complete pytest suite (12 passed)
└── frontend/
    ├── src/
    │   ├── context/AuthContext.tsx  # Session state & role-based access
    │   ├── api/client.ts            # Authenticated fetch wrapper
    │   ├── components/              # Layout, Sidebar, Topbar, Modals
    │   └── pages/                   # 9 Enterprise staff pages
    └── dist/                        # Production frontend bundle
```

---

## 🔑 Default Staff Credentials

| Role | Username | Password | Permissions |
|---|---|---|---|
| **Chief Admin** | `admin` | `AdminPassword123!` | Root authority, staff provisioning, session setup, student deletion |
| **Exam Staff** | `exam_officer` | `OfficerPass123!` | Student import, automation execution, result verification, report exports |
| **Auditor / Observer** | `faculty_viewer` | `ViewerPass123!` | Read-only matrix inspection, PDF downloads, and statistical monitoring |

---

## 🚀 Quick Start Instructions

### Option 1: Double-Click Launcher (Windows)
Double-click `start_platform.bat`. It will seed the database and start the server at `http://127.0.0.1:8000`.

### Option 2: Command Line

1. **Start the Backend:**
   ```bash
   cd backend
   python -m app.seed
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Access the Portal:**
   Open `http://127.0.0.1:8000` in any web browser.

3. **Run Automated Test Suite:**
   ```bash
   cd backend
   python -m pytest tests -v
   ```
