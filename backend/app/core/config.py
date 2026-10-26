import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
PDF_DIR = STORAGE_DIR / "pdfs"
REPORTS_DIR = STORAGE_DIR / "reports"
UPLOADS_DIR = STORAGE_DIR / "uploads"

# Ensure storage directories exist
PDF_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Examination Result Automation Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "prod-hardened-exam-sec-key-9f8a3b2c1d4e5f6a7b8c9d0e1f2a3b4c")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours
    
    # Database (Using SQLite with WAL mode for robust local transactions)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/exam_results.db")
    
    # Storage Paths
    BASE_DIR: Path = BASE_DIR
    STORAGE_DIR: Path = STORAGE_DIR
    PDF_DIR: Path = PDF_DIR
    REPORTS_DIR: Path = REPORTS_DIR
    UPLOADS_DIR: Path = UPLOADS_DIR
    
    # Institution Info
    INSTITUTION_NAME: str = "College of Engineering & Technology"
    INSTITUTION_CODE: str = "AUTONOMOUS-7100"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "*"
    ]

    model_config = {"case_sensitive": True}

settings = Settings()
