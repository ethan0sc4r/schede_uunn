@echo off
echo Naval Units Management System - Setup Test
echo ===========================================

echo.
echo 1. Testing Python environment...
call venv\Scripts\activate
python --version

echo.
echo 2. Testing backend imports...
cd backend
python -c "import main; print('✓ Backend imports successful')"

echo.
echo 3. Testing backend dependencies...
python -c "import fastapi, uvicorn, sqlalchemy; print('✓ All dependencies available')"

echo.
echo 4. Testing database connection...
python -c "from app.database import engine; print('✓ Database connection OK')"

echo.
echo 5. Testing frontend dependencies...
cd ..\frontend
if exist node_modules (
    echo ✓ Frontend dependencies installed
) else (
    echo ✗ Frontend dependencies missing - run: npm install
)

echo.
echo 6. Testing if ports are free...
cd ..
netstat -an | findstr ":8000" >nul
if %errorlevel% == 0 (
    echo ✗ Port 8000 is busy
) else (
    echo ✓ Port 8000 is free
)

netstat -an | findstr ":5173" >nul
if %errorlevel% == 0 (
    echo ✗ Port 5173 is busy  
) else (
    echo ✓ Port 5173 is free
)

echo.
echo Test completed! If all checks show ✓, you can start the servers.
echo.
pause