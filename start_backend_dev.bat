@echo off
echo Starting Naval Units Backend Server (Development Mode)...
echo.
echo WARNING: This mode may have issues with Python 3.13
echo Use start_backend.bat for stable operation
echo.
call venv\Scripts\activate
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause