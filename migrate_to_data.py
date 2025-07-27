#!/usr/bin/env python3
"""
Migration script to move existing data to data/ directory
"""
import os
import shutil
from pathlib import Path

def migrate_data():
    """Move existing data files to data/ directory"""
    
    # Create data directory if it doesn't exist
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    
    # Create subdirectories
    (data_dir / "uploads").mkdir(exist_ok=True)
    (data_dir / "exports").mkdir(exist_ok=True)
    
    print("Created data directory structure")
    
    # Move existing database files
    db_files = [
        "naval_units.db",
        "naval_units_simple.db"
    ]
    
    for db_file in db_files:
        if os.path.exists(db_file):
            shutil.move(db_file, data_dir / db_file)
            print(f"Moved {db_file} to data/")
    
    # Move existing uploads
    if os.path.exists("uploads"):
        if os.path.exists(data_dir / "uploads"):
            # Merge directories
            for item in os.listdir("uploads"):
                shutil.move(os.path.join("uploads", item), data_dir / "uploads" / item)
        else:
            shutil.move("uploads", data_dir / "uploads")
        print("Moved uploads/ to data/uploads/")
    
    # Move existing exports
    if os.path.exists("exports"):
        if os.path.exists(data_dir / "exports"):
            # Merge directories
            for item in os.listdir("exports"):
                shutil.move(os.path.join("exports", item), data_dir / "exports" / item)
        else:
            shutil.move("exports", data_dir / "exports")
        print("Moved exports/ to data/exports/")
    
    print("Migration completed! All data moved to data/ directory")
    print("\nNext steps:")
    print("1. Restart the backend server")
    print("2. Verify that all data is accessible")
    print("3. Delete old empty directories if desired")

if __name__ == "__main__":
    migrate_data()