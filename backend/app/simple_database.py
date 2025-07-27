import sqlite3
import hashlib
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
from contextlib import contextmanager

DATABASE_PATH = "naval_units_simple.db"

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Enable dict-like access
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    """Initialize the database with all required tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                hashed_password TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 0,
                is_admin BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Naval units table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS naval_units (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                unit_class TEXT NOT NULL,
                nation TEXT,
                logo_path TEXT,
                silhouette_path TEXT,
                flag_path TEXT,
                background_color TEXT DEFAULT '#ffffff',
                layout_config TEXT,  -- JSON string
                silhouette_zoom TEXT DEFAULT '1.0',
                silhouette_position_x TEXT DEFAULT '0',
                silhouette_position_y TEXT DEFAULT '0',
                created_by INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
        ''')
        
        # Unit characteristics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS unit_characteristics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                naval_unit_id INTEGER NOT NULL,
                characteristic_name TEXT NOT NULL,
                characteristic_value TEXT NOT NULL,
                order_index INTEGER DEFAULT 0,
                FOREIGN KEY (naval_unit_id) REFERENCES naval_units (id) ON DELETE CASCADE
            )
        ''')
        
        # Groups table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                logo_path TEXT,
                flag_path TEXT,
                created_by INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
        ''')
        
        # Group memberships table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS group_memberships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                naval_unit_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
                FOREIGN KEY (naval_unit_id) REFERENCES naval_units (id) ON DELETE CASCADE
            )
        ''')
        
        conn.commit()

class SimpleDatabase:
    """Simple database wrapper without SQLAlchemy"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify a password against its hash"""
        return hashlib.sha256(password.encode()).hexdigest() == hashed
    
    # User operations
    @staticmethod
    def create_user(email: str, first_name: str, last_name: str, password: str) -> Optional[int]:
        """Create a new user"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                hashed_password = SimpleDatabase.hash_password(password)
                cursor.execute('''
                    INSERT INTO users (email, first_name, last_name, hashed_password)
                    VALUES (?, ?, ?, ?)
                ''', (email, first_name, last_name, hashed_password))
                conn.commit()
                return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None  # Email already exists
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict]:
        """Get user by email"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    @staticmethod
    def activate_user(user_id: int) -> bool:
        """Activate a user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE users SET is_active = 1 WHERE id = ?', (user_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    def make_admin(user_id: int) -> bool:
        """Make a user admin"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE users SET is_admin = 1 WHERE id = ?', (user_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    # Naval unit operations
    @staticmethod
    def create_naval_unit(name: str, unit_class: str, created_by: int, **kwargs) -> Optional[int]:
        """Create a new naval unit"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check for uniqueness
            cursor.execute('''
                SELECT id FROM naval_units WHERE name = ? AND unit_class = ?
            ''', (name, unit_class))
            if cursor.fetchone():
                return None  # Already exists
            
            cursor.execute('''
                INSERT INTO naval_units (
                    name, unit_class, nation, background_color, layout_config,
                    silhouette_zoom, silhouette_position_x, silhouette_position_y, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                name, unit_class, kwargs.get('nation'),
                kwargs.get('background_color', '#ffffff'),
                json.dumps(kwargs.get('layout_config', {})),
                kwargs.get('silhouette_zoom', '1.0'),
                kwargs.get('silhouette_position_x', '0'),
                kwargs.get('silhouette_position_y', '0'),
                created_by
            ))
            conn.commit()
            return cursor.lastrowid
    
    @staticmethod
    def get_naval_units(skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get list of naval units"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM naval_units ORDER BY created_at DESC LIMIT ? OFFSET ?
            ''', (limit, skip))
            return [dict(row) for row in cursor.fetchall()]
    
    @staticmethod
    def get_naval_unit_by_id(unit_id: int) -> Optional[Dict]:
        """Get naval unit by ID with characteristics"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get unit
            cursor.execute('SELECT * FROM naval_units WHERE id = ?', (unit_id,))
            unit_row = cursor.fetchone()
            if not unit_row:
                return None
            
            unit = dict(unit_row)
            
            # Get characteristics
            cursor.execute('''
                SELECT * FROM unit_characteristics 
                WHERE naval_unit_id = ? 
                ORDER BY order_index
            ''', (unit_id,))
            unit['characteristics'] = [dict(row) for row in cursor.fetchall()]
            
            # Parse JSON fields
            if unit['layout_config']:
                try:
                    unit['layout_config'] = json.loads(unit['layout_config'])
                except:
                    unit['layout_config'] = {}
            
            return unit
    
    @staticmethod
    def add_characteristic(unit_id: int, name: str, value: str, order_index: int = 0) -> int:
        """Add a characteristic to a naval unit"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO unit_characteristics (naval_unit_id, characteristic_name, characteristic_value, order_index)
                VALUES (?, ?, ?, ?)
            ''', (unit_id, name, value, order_index))
            conn.commit()
            return cursor.lastrowid
    
    @staticmethod
    def search_naval_units(query: str, search_type: str = "all") -> List[Dict]:
        """Search naval units"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            if search_type == "name":
                sql = "SELECT * FROM naval_units WHERE name LIKE ?"
                params = (f"%{query}%",)
            elif search_type == "class":
                sql = "SELECT * FROM naval_units WHERE unit_class LIKE ?"
                params = (f"%{query}%",)
            elif search_type == "nation":
                sql = "SELECT * FROM naval_units WHERE nation LIKE ?"
                params = (f"%{query}%",)
            else:  # all
                sql = """
                    SELECT * FROM naval_units 
                    WHERE name LIKE ? OR unit_class LIKE ? OR nation LIKE ?
                """
                params = (f"%{query}%", f"%{query}%", f"%{query}%")
            
            cursor.execute(sql, params)
            return [dict(row) for row in cursor.fetchall()]

# Initialize database on import
init_database()

# Create default admin user if not exists
def create_default_admin():
    """Create default admin user"""
    admin = SimpleDatabase.get_user_by_email("admin@example.com")
    if not admin:
        user_id = SimpleDatabase.create_user("admin@example.com", "Admin", "User", "admin123")
        if user_id:
            SimpleDatabase.activate_user(user_id)
            SimpleDatabase.make_admin(user_id)
            print("Default admin user created: admin@example.com / admin123")

create_default_admin()