from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.students import router as students_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.results import router as results_router
from app.api.v1.automation import router as automation_router
from app.api.v1.pdfs import router as pdfs_router
from app.api.v1.reports import router as reports_router
from app.api.v1.audit import router as audit_router
from app.api.v1.settings import router as settings_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(students_router, prefix="/students", tags=["Student Registry"])
api_router.include_router(sessions_router, prefix="/sessions", tags=["Examination Sessions"])
api_router.include_router(results_router, prefix="/results", tags=["Result Analysis"])
api_router.include_router(automation_router, prefix="/automation", tags=["Result Automation"])
api_router.include_router(pdfs_router, prefix="/pdfs", tags=["PDF Management"])
api_router.include_router(reports_router, prefix="/reports", tags=["Excel Reports"])
api_router.include_router(audit_router, prefix="/audit", tags=["Audit Logs"])
api_router.include_router(settings_router, prefix="/settings", tags=["Settings & Staff"])
