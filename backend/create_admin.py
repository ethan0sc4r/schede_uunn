#!/usr/bin/env python3
"""
Script to create the first admin user for the Naval Units Management System
"""

from app.database import SessionLocal, Base, engine
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from passlib.context import CryptContext

# Create tables
Base.metadata.create_all(bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Simple User model for admin creation
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

def create_admin_user():
    """Create the first admin user"""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.is_admin == True).first()
        if existing_admin:
            print(f"Admin user already exists: {existing_admin.email}")
            return
        
        # Create admin user
        admin_email = input("Enter admin email: ").strip()
        admin_password = input("Enter admin password: ").strip()
        admin_first_name = input("Enter admin first name: ").strip()
        admin_last_name = input("Enter admin last name: ").strip()
        
        if not all([admin_email, admin_password, admin_first_name, admin_last_name]):
            print("All fields are required!")
            return
        
        # Check if user with this email already exists
        existing_user = db.query(User).filter(User.email == admin_email).first()
        if existing_user:
            print(f"User with email {admin_email} already exists!")
            return
        
        admin_user = User(
            email=admin_email,
            first_name=admin_first_name,
            last_name=admin_last_name,
            hashed_password=get_password_hash(admin_password),
            is_active=True,
            is_admin=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("Admin user created successfully!")
        print(f"  Email: {admin_user.email}")
        print(f"  Name: {admin_user.first_name} {admin_user.last_name}")
        print(f"  ID: {admin_user.id}")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Naval Units Management System - Admin User Creator")
    print("=" * 50)
    create_admin_user()