#!/usr/bin/env python3
"""
Script to initialize database and create admin user
Run this ONCE before starting the application
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.simple_database import init_database, SimpleDatabase
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def main():
    print("=" * 60)
    print("Naval Units Management System - Database Initialization")
    print("=" * 60)
    print()

    # Step 1: Initialize database
    print("📦 Step 1: Initializing database...")
    try:
        init_database()
        print("✅ Database initialized successfully!")
        print(f"   Location: ./data/naval_units.db")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return

    print()

    # Step 2: Create admin user
    print("👤 Step 2: Creating admin user...")

    db = SimpleDatabase()

    # Check if admin already exists
    existing_admin = db.get_user_by_email("admin@example.com")
    if existing_admin:
        print("⚠️  Admin user already exists!")
        print(f"   Email: admin@example.com")
        print(f"   You can login with the existing credentials")
        return

    # Create default admin
    admin_email = "admin@example.com"
    admin_password = "admin123"
    admin_first_name = "Admin"
    admin_last_name = "User"

    try:
        hashed_password = get_password_hash(admin_password)

        user_id = db.create_user(
            email=admin_email,
            first_name=admin_first_name,
            last_name=admin_last_name,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=True
        )

        print("✅ Admin user created successfully!")
        print()
        print("=" * 60)
        print("🎉 SETUP COMPLETE!")
        print("=" * 60)
        print()
        print("You can now start the application:")
        print()
        print("  Backend:  python3 -m uvicorn simple_main:app --reload --port 8001")
        print("  Frontend: npm run dev")
        print()
        print("Login credentials:")
        print(f"  📧 Email:    {admin_email}")
        print(f"  🔑 Password: {admin_password}")
        print()
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
