@echo off
echo Stopping Naval Units servers...

echo Checking for processes on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000"') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Checking for processes on port 8001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001"') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Checking for processes on port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo All servers stopped.
pause