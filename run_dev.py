#!/usr/bin/env python3
"""
Development server launcher for Naval Units Management System
Runs both backend (FastAPI) and frontend (Vite) servers
"""

import subprocess
import sys
import os
import time
from pathlib import Path

def check_requirements():
    """Check if required dependencies are installed"""
    try:
        import uvicorn
        import fastapi
    except ImportError:
        print("Backend dependencies not installed.")
        print("Run: pip install -r backend/requirements.txt")
        return False
    
    frontend_path = Path("frontend")
    if not (frontend_path / "node_modules").exists():
        print("Frontend dependencies not installed.")
        print("Run: cd frontend && npm install")
        return False
    
    return True

def run_backend():
    """Start the FastAPI backend server"""
    print("Starting backend server...")
    os.chdir("backend")
    
    # Use virtual environment python on Windows
    if os.name == 'nt':  # Windows
        python_exe = os.path.join("..", "venv", "Scripts", "python.exe")
        if not os.path.exists(python_exe):
            python_exe = sys.executable
    else:
        python_exe = sys.executable
    
    return subprocess.Popen([
        python_exe, "-m", "uvicorn", "main:app", 
        "--reload", "--host", "127.0.0.1", "--port", "8000"
    ])

def run_frontend():
    """Start the Vite frontend server"""
    print("Starting frontend server...")
    os.chdir("frontend")
    return subprocess.Popen(["npm", "run", "dev"])

def main():
    """Main function to start both servers"""
    if not check_requirements():
        sys.exit(1)
    
    print("Naval Units Management System - Development Server")
    print("=" * 50)
    
    # Store original directory
    original_dir = os.getcwd()
    
    try:
        # Start backend
        os.chdir(original_dir)
        backend_process = run_backend()
        
        # Wait a bit for backend to start
        time.sleep(2)
        
        # Start frontend
        os.chdir(original_dir)
        frontend_process = run_frontend()
        
        print("\nBoth servers started successfully!")
        print("Backend API: http://localhost:8000")
        print("Frontend: http://localhost:5173")
        print("API Docs: http://localhost:8000/docs")
        print("\nPress Ctrl+C to stop both servers")
        
        # Wait for both processes
        backend_process.wait()
        frontend_process.wait()
        
    except KeyboardInterrupt:
        print("\nStopping servers...")
        if 'backend_process' in locals():
            backend_process.terminate()
        if 'frontend_process' in locals():
            frontend_process.terminate()
        print("Servers stopped.")
    
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    finally:
        os.chdir(original_dir)

if __name__ == "__main__":
    main()