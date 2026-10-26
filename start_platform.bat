@echo off
title College Examination Result Automation Platform
echo ========================================================
echo   College Examination Result Automation Platform
echo   Controller of Examinations Enterprise Engine
echo ========================================================
echo.

cd /d "%~dp0backend"
echo [1/2] Initializing and verifying database...
python -m app.seed

echo.
echo [2/2] Starting Enterprise Server on http://localhost:8000 ...
echo (The web portal will be accessible at http://localhost:8000)
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
