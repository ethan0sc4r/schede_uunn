@echo off
echo Naval Units Management System - Windows Setup
echo ===============================================

echo.
echo Step 1: Installing backend dependencies...
call venv\Scripts\activate
cd backend
pip install -r requirements.txt
cd ..

echo.
echo Step 2: Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo Step 3: Creating admin user...
call venv\Scripts\activate
cd backend
echo admin@example.com| set /p= 
echo admin123| set /p=
echo Admin| set /p=
echo User| set /p=
python create_admin.py
cd ..

echo.
echo Setup completed!
echo.
echo To start the servers:
echo 1. Run start_backend.bat in one terminal
echo 2. Run start_frontend.bat in another terminal
echo.
echo OR run start_servers.bat to open both automatically
echo.
pause