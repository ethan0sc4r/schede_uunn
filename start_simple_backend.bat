@echo off
echo Starting Naval Units Backend Server (Simple Version - No SQLAlchemy)...
echo.
echo This version uses pure SQLite3 and is fully compatible with Python 3.13
echo Default admin user: admin@example.com / admin123
echo.
call venv\Scripts\activate
cd backend
python simple_main.py
pause