import sqlite3
import hashlib
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
from contextlib import contextmanager

DATABASE_PATH = "./data/naval_units.db"

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
                notes TEXT,
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
            
            units = []
            for row in cursor.fetchall():
                unit = dict(row)
                
                # Parse JSON fields (same as get_naval_unit_by_id)
                if unit['layout_config']:
                    try:
                        unit['layout_config'] = json.loads(unit['layout_config'])
                    except:
                        unit['layout_config'] = {}
                
                units.append(unit)
            
            return units
    
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
    
    # Group operations
    @staticmethod
    def create_group(name: str, description: str, created_by: int, naval_unit_ids: List[int]) -> Optional[int]:
        """Create a new group"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Create group
            cursor.execute('''
                INSERT INTO groups (name, description, created_by)
                VALUES (?, ?, ?)
            ''', (name, description, created_by))
            group_id = cursor.lastrowid
            
            # Add naval unit memberships
            for unit_id in naval_unit_ids:
                cursor.execute('''
                    INSERT INTO group_memberships (group_id, naval_unit_id)
                    VALUES (?, ?)
                ''', (group_id, unit_id))
            
            conn.commit()
            return group_id
    
    @staticmethod
    def get_groups(skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get list of groups with naval units"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM groups ORDER BY created_at DESC LIMIT ? OFFSET ?
            ''', (limit, skip))
            
            groups = []
            for group_row in cursor.fetchall():
                group = dict(group_row)
                
                # Get naval units for this group
                cursor.execute('''
                    SELECT nu.* FROM naval_units nu
                    JOIN group_memberships gm ON nu.id = gm.naval_unit_id
                    WHERE gm.group_id = ?
                ''', (group['id'],))
                group['naval_units'] = [dict(row) for row in cursor.fetchall()]
                
                groups.append(group)
            
            return groups
    
    @staticmethod
    def get_group_by_id(group_id: int) -> Optional[Dict]:
        """Get group by ID with naval units"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get group
            cursor.execute('SELECT * FROM groups WHERE id = ?', (group_id,))
            group_row = cursor.fetchone()
            if not group_row:
                return None
            
            group = dict(group_row)
            
            # Get naval units for this group
            cursor.execute('''
                SELECT nu.* FROM naval_units nu
                JOIN group_memberships gm ON nu.id = gm.naval_unit_id
                WHERE gm.group_id = ?
            ''', (group_id,))
            
            naval_units = []
            for unit_row in cursor.fetchall():
                unit = dict(unit_row)
                # Parse layout_config
                if unit['layout_config']:
                    try:
                        unit['layout_config'] = json.loads(unit['layout_config'])
                    except:
                        unit['layout_config'] = {}
                naval_units.append(unit)
            
            group['naval_units'] = naval_units
            return group
    
    @staticmethod
    def update_group(group_id: int, name: str = None, description: str = None, naval_unit_ids: List[int] = None) -> bool:
        """Update a group"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Update basic info
            if name is not None or description is not None:
                update_fields = []
                params = []
                if name is not None:
                    update_fields.append("name = ?")
                    params.append(name)
                if description is not None:
                    update_fields.append("description = ?")
                    params.append(description)
                params.append(group_id)
                
                cursor.execute(f'''
                    UPDATE groups SET {", ".join(update_fields)} WHERE id = ?
                ''', params)
            
            # Update naval unit memberships
            if naval_unit_ids is not None:
                # Remove existing memberships
                cursor.execute('DELETE FROM group_memberships WHERE group_id = ?', (group_id,))
                
                # Add new memberships
                for unit_id in naval_unit_ids:
                    cursor.execute('''
                        INSERT INTO group_memberships (group_id, naval_unit_id)
                        VALUES (?, ?)
                    ''', (group_id, unit_id))
            
            conn.commit()
            return cursor.rowcount > 0 or naval_unit_ids is not None
    
    @staticmethod
    def delete_group(group_id: int) -> bool:
        """Delete a group"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM groups WHERE id = ?', (group_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    # Naval unit file upload operations
    @staticmethod
    def update_naval_unit_logo(unit_id: int, logo_path: str) -> bool:
        """Update naval unit logo path"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE naval_units SET logo_path = ? WHERE id = ?', (logo_path, unit_id))
            conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    def update_naval_unit_silhouette(unit_id: int, silhouette_path: str) -> bool:
        """Update naval unit silhouette path"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE naval_units SET silhouette_path = ? WHERE id = ?', (silhouette_path, unit_id))
            conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    def update_naval_unit_flag(unit_id: int, flag_path: str) -> bool:
        """Update naval unit flag path"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE naval_units SET flag_path = ? WHERE id = ?', (flag_path, unit_id))
            conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    def update_naval_unit(unit_id: int, **kwargs) -> bool:
        """Update naval unit fields"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            update_fields = []
            params = []
            
            for field, value in kwargs.items():
                if field in ['name', 'unit_class', 'nation', 'background_color', 'silhouette_zoom', 
                           'silhouette_position_x', 'silhouette_position_y', 'notes']:
                    update_fields.append(f"{field} = ?")
                    params.append(value)
                elif field == 'characteristics':
                    # Skip characteristics for now - they are handled separately
                    pass
                elif field == 'layout_config':
                    update_fields.append("layout_config = ?")
                    params.append(json.dumps(value) if value else None)
                    
                    # Also extract and update separate image path fields for backward compatibility
                    if value and 'elements' in value:
                        for element in value['elements']:
                            if element.get('type') == 'silhouette' and element.get('image'):
                                update_fields.append("silhouette_path = ?")
                                params.append(element['image'])
                            elif element.get('type') == 'logo' and element.get('image'):
                                update_fields.append("logo_path = ?")
                                params.append(element['image'])
                            elif element.get('type') == 'flag' and element.get('image'):
                                update_fields.append("flag_path = ?")
                                params.append(element['image'])
            
            if update_fields:
                params.append(unit_id)
                sql = f"UPDATE naval_units SET {', '.join(update_fields)} WHERE id = ?"
                cursor.execute(sql, params)
                conn.commit()
                return cursor.rowcount > 0
            return False
    
    @staticmethod
    def delete_naval_unit(unit_id: int) -> bool:
        """Delete a naval unit"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM naval_units WHERE id = ?', (unit_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    # Group file upload operations
    @staticmethod
    def update_group_logo(group_id: int, logo_path: str) -> bool:
        """Update group logo path"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE groups SET logo_path = ? WHERE id = ?', (logo_path, group_id))
            conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    def update_group_flag(group_id: int, flag_path: str) -> bool:
        """Update group flag path"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE groups SET flag_path = ? WHERE id = ?', (flag_path, group_id))
            conn.commit()
            return cursor.rowcount > 0
    
    # Admin operations
    @staticmethod
    def get_all_users(skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all users"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', (limit, skip))
            return [dict(row) for row in cursor.fetchall()]
    
    @staticmethod
    def get_pending_users() -> List[Dict]:
        """Get users waiting for activation"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE is_active = 0 ORDER BY created_at DESC')
            return [dict(row) for row in cursor.fetchall()]
    
    @staticmethod
    def deactivate_user(user_id: int) -> bool:
        """Deactivate a user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE users SET is_active = 0 WHERE id = ?', (user_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    def remove_admin(user_id: int) -> bool:
        """Remove admin privileges from a user"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE users SET is_admin = 0 WHERE id = ?', (user_id,))
            conn.commit()
            return cursor.rowcount > 0

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

def migrate_database():
    """Run database migrations"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Add notes column if it doesn't exist
            cursor.execute("PRAGMA table_info(naval_units)")
            columns = [column[1] for column in cursor.fetchall()]
            if 'notes' not in columns:
                cursor.execute("ALTER TABLE naval_units ADD COLUMN notes TEXT")
                conn.commit()
                print("✅ Added notes column to naval_units table")
    except Exception as e:
        print(f"Migration error: {e}")

# Run migrations and create default admin
migrate_database()
create_default_admin()