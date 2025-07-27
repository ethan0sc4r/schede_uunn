@echo off
echo Naval Units Management System - Development Server
echo ====================================================

echo Activating virtual environment...
call venv\Scripts\activate

echo Starting backend server...
start "Backend Server" cmd /k "call venv\Scripts\activate && cd backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend API: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Note: Both servers will open in separate windows
echo Close both command windows to stop the servers.
pause