@echo off
echo Starting Naval Units Backend Server...
echo.
echo Note: Running without auto-reload to avoid Python 3.13 compatibility issues
echo You'll need to restart manually after code changes.
echo.
echo Checking if port 8000 is free...
netstat -an | findstr ":8000" >nul
if %errorlevel% == 0 (
    echo Warning: Port 8000 is already in use!
    echo Trying to start on port 8001 instead...
    call venv\Scripts\activate
    cd backend
    python -m uvicorn main:app --host 127.0.0.1 --port 8001
) else (
    echo Port 8000 is free, starting server...
    call venv\Scripts\activate
    cd backend
    python -m uvicorn main:app --host 127.0.0.1 --port 8000
)
pause