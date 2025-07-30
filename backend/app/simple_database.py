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
                current_template_id TEXT DEFAULT 'naval-card-standard',
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
        
        # Template states for each unit - stores element states per template
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS unit_template_states (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_id INTEGER NOT NULL,
                template_id TEXT NOT NULL,
                element_states TEXT,  -- JSON string with element positions and visibility
                canvas_config TEXT,   -- JSON string with canvas settings for this template
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES naval_units (id) ON DELETE CASCADE,
                UNIQUE(unit_id, template_id)
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
                FOREIGN KEY (naval_unit_id) REFERENCES naval_units (id) ON DELETE CASCADE,
                UNIQUE(group_id, naval_unit_id)
            )
        ''')
        
        # Templates table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                elements TEXT NOT NULL,
                canvas_width INTEGER DEFAULT 1123,
                canvas_height INTEGER DEFAULT 794,
                canvas_background TEXT DEFAULT '#ffffff',
                canvas_border_width INTEGER DEFAULT 2,
                canvas_border_color TEXT DEFAULT '#000000',
                logo_visible BOOLEAN DEFAULT 1,
                flag_visible BOOLEAN DEFAULT 1,
                silhouette_visible BOOLEAN DEFAULT 1,
                created_by INTEGER NOT NULL,
                is_default BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
        ''')
        
        # Add visibility columns to existing templates table if they don't exist
        try:
            cursor.execute('ALTER TABLE templates ADD COLUMN logo_visible BOOLEAN DEFAULT 1')
        except sqlite3.OperationalError:
            pass  # Column already exists
        try:
            cursor.execute('ALTER TABLE templates ADD COLUMN flag_visible BOOLEAN DEFAULT 1')
        except sqlite3.OperationalError:
            pass  # Column already exists
        try:
            cursor.execute('ALTER TABLE templates ADD COLUMN silhouette_visible BOOLEAN DEFAULT 1')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        # Quiz sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS quiz_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participant_name TEXT NOT NULL,
                participant_surname TEXT NOT NULL,
                quiz_type TEXT NOT NULL,  -- 'name_to_class', 'nation_to_class', 'class_to_flag'
                total_questions INTEGER NOT NULL,
                time_per_question INTEGER NOT NULL,  -- in seconds
                correct_answers INTEGER DEFAULT 0,
                score INTEGER DEFAULT 0,  -- 1-30 scale
                status TEXT DEFAULT 'active',  -- 'active', 'completed', 'abandoned'
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Quiz questions table (stores individual questions for each session)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS quiz_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                question_number INTEGER NOT NULL,
                question_type TEXT NOT NULL,  -- 'name_to_class', 'nation_to_class', 'class_to_flag'
                naval_unit_id INTEGER NOT NULL,
                correct_answer TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                user_answer TEXT NULL,
                is_correct BOOLEAN NULL,
                answered_at TIMESTAMP NULL,
                FOREIGN KEY (session_id) REFERENCES quiz_sessions (id) ON DELETE CASCADE,
                FOREIGN KEY (naval_unit_id) REFERENCES naval_units (id)
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

    @staticmethod
    def update_user_password(user_id: int, new_password: str) -> bool:
        """Update user password"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                hashed_password = SimpleDatabase.hash_password(new_password)
                cursor.execute('''
                    UPDATE users 
                    SET hashed_password = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (hashed_password, user_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error updating user password: {e}")
            return False
    
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
                    name, unit_class, nation, background_color, layout_config, current_template_id,
                    logo_path, flag_path, silhouette_path,
                    silhouette_zoom, silhouette_position_x, silhouette_position_y, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                name, unit_class, kwargs.get('nation'),
                kwargs.get('background_color', '#ffffff'),
                json.dumps(kwargs.get('layout_config')) if kwargs.get('layout_config') else None,
                kwargs.get('current_template_id'),
                kwargs.get('logo_path'),
                kwargs.get('flag_path'),
                kwargs.get('silhouette_path'),
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
                try:
                    cursor.execute('''
                        INSERT INTO group_memberships (group_id, naval_unit_id)
                        VALUES (?, ?)
                    ''', (group_id, unit_id))
                except Exception as e:
                    if "UNIQUE constraint failed" in str(e):
                        continue  # Skip duplicates
                    else:
                        raise e
            
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
        """Delete a group and all its memberships"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # First, explicitly delete memberships
            cursor.execute('DELETE FROM group_memberships WHERE group_id = ?', (group_id,))
            
            # Then delete the group itself
            cursor.execute('DELETE FROM groups WHERE id = ?', (group_id,))
            group_deleted = cursor.rowcount > 0
            
            conn.commit()
            return group_deleted
    
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
                if field in ['name', 'unit_class', 'nation', 'background_color', 'current_template_id',
                           'silhouette_zoom', 'silhouette_position_x', 'silhouette_position_y', 'notes']:
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

    # Template state management methods
    @staticmethod
    def save_unit_template_state(unit_id: int, template_id: str, element_states: dict, canvas_config: dict) -> bool:
        """Save the state of elements for a specific template"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO unit_template_states 
                    (unit_id, template_id, element_states, canvas_config, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ''', (unit_id, template_id, json.dumps(element_states), json.dumps(canvas_config)))
                conn.commit()
                return True
        except Exception as e:
            print(f"Error saving template state: {e}")
            return False
    
    @staticmethod
    def get_unit_template_state(unit_id: int, template_id: str) -> Optional[Dict[str, Any]]:
        """Get the saved state for a specific template"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT element_states, canvas_config FROM unit_template_states 
                    WHERE unit_id = ? AND template_id = ?
                ''', (unit_id, template_id))
                result = cursor.fetchone()
                
                if result:
                    return {
                        'element_states': json.loads(result['element_states']) if result['element_states'] else {},
                        'canvas_config': json.loads(result['canvas_config']) if result['canvas_config'] else {}
                    }
                return None
        except Exception as e:
            print(f"Error getting template state: {e}")
            return None
    
    @staticmethod
    def get_all_template_states_for_unit(unit_id: int) -> Dict[str, Any]:
        """Get all template states for a unit"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT template_id, element_states, canvas_config FROM unit_template_states 
                    WHERE unit_id = ?
                ''', (unit_id,))
                results = cursor.fetchall()
                
                template_states = {}
                for row in results:
                    template_states[row['template_id']] = {
                        'element_states': json.loads(row['element_states']) if row['element_states'] else {},
                        'canvas_config': json.loads(row['canvas_config']) if row['canvas_config'] else {}
                    }
                return template_states
        except Exception as e:
            print(f"Error getting all template states: {e}")
            return {}

    # Template management methods
    @staticmethod
    def save_template(template_data: dict, user_id: int) -> str:
        """Save a new template"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                template_id = template_data.get('id', f"template_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
                
                cursor.execute('''
                    INSERT OR REPLACE INTO templates 
                    (id, name, description, elements, canvas_width, canvas_height, 
                     canvas_background, canvas_border_width, canvas_border_color, 
                     logo_visible, flag_visible, silhouette_visible, created_by, is_default, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ''', (
                    template_id,
                    template_data['name'],
                    template_data.get('description', ''),
                    json.dumps(template_data['elements']),
                    template_data.get('canvasWidth', 1123),
                    template_data.get('canvasHeight', 794),
                    template_data.get('canvasBackground', '#ffffff'),
                    template_data.get('canvasBorderWidth', 2),
                    template_data.get('canvasBorderColor', '#000000'),
                    template_data.get('logoVisible', True),
                    template_data.get('flagVisible', True),
                    template_data.get('silhouetteVisible', True),
                    user_id,
                    template_data.get('isDefault', False)
                ))
                conn.commit()
                return template_id
        except Exception as e:
            print(f"Error saving template: {e}")
            raise e

    @staticmethod
    def get_templates(user_id: int) -> List[Dict]:
        """Get all templates for a user"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM templates 
                    WHERE created_by = ? OR is_default = 1
                    ORDER BY is_default DESC, created_at DESC
                ''', (user_id,))
                
                templates = []
                for row in cursor.fetchall():
                    template = dict(row)
                    template['elements'] = json.loads(template['elements'])
                    # Map database fields to frontend expected fields
                    template['canvasWidth'] = template['canvas_width']
                    template['canvasHeight'] = template['canvas_height']
                    template['canvasBackground'] = template['canvas_background']
                    template['canvasBorderWidth'] = template['canvas_border_width']
                    template['canvasBorderColor'] = template['canvas_border_color']
                    template['logoVisible'] = bool(template.get('logo_visible', True))
                    template['flagVisible'] = bool(template.get('flag_visible', True))
                    template['silhouetteVisible'] = bool(template.get('silhouette_visible', True))
                    template['isDefault'] = bool(template['is_default'])
                    template['createdAt'] = template['created_at']
                    templates.append(template)
                
                return templates
        except Exception as e:
            print(f"Error getting templates: {e}")
            return []

    @staticmethod
    def get_template(template_id: str, user_id: int) -> Optional[Dict]:
        """Get a specific template"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM templates 
                    WHERE id = ? AND (created_by = ? OR is_default = 1)
                ''', (template_id, user_id))
                
                row = cursor.fetchone()
                if row:
                    template = dict(row)
                    template['elements'] = json.loads(template['elements'])
                    # Map database fields to frontend expected fields
                    template['canvasWidth'] = template['canvas_width']
                    template['canvasHeight'] = template['canvas_height']
                    template['canvasBackground'] = template['canvas_background']
                    template['canvasBorderWidth'] = template['canvas_border_width']
                    template['canvasBorderColor'] = template['canvas_border_color']
                    template['logoVisible'] = bool(template.get('logo_visible', True))
                    template['flagVisible'] = bool(template.get('flag_visible', True))
                    template['silhouetteVisible'] = bool(template.get('silhouette_visible', True))
                    template['isDefault'] = bool(template['is_default'])
                    template['createdAt'] = template['created_at']
                    return template
                return None
        except Exception as e:
            print(f"Error getting template: {e}")
            return None

    @staticmethod
    def update_template(template_id: str, template_data: dict, user_id: int) -> bool:
        """Update a template"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE templates SET 
                    name = ?, description = ?, elements = ?, canvas_width = ?, canvas_height = ?,
                    canvas_background = ?, canvas_border_width = ?, canvas_border_color = ?,
                    logo_visible = ?, flag_visible = ?, silhouette_visible = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND created_by = ?
                ''', (
                    template_data['name'],
                    template_data.get('description', ''),
                    json.dumps(template_data['elements']),
                    template_data.get('canvasWidth', 1123),
                    template_data.get('canvasHeight', 794),
                    template_data.get('canvasBackground', '#ffffff'),
                    template_data.get('canvasBorderWidth', 2),
                    template_data.get('canvasBorderColor', '#000000'),
                    template_data.get('logoVisible', True),
                    template_data.get('flagVisible', True),
                    template_data.get('silhouetteVisible', True),
                    template_id,
                    user_id
                ))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error updating template: {e}")
            return False

    @staticmethod
    def delete_template(template_id: str, user_id: int) -> bool:
        """Delete a template"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                # Don't allow deletion of default templates
                cursor.execute('''
                    DELETE FROM templates 
                    WHERE id = ? AND created_by = ? AND is_default = 0
                ''', (template_id, user_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error deleting template: {e}")
            return False

    @staticmethod
    def get_units_using_template(template_id: str) -> List[Dict]:
        """Get all naval units that are currently using a specific template"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM naval_units 
                    WHERE current_template_id = ?
                ''', (template_id,))
                
                units = []
                for row in cursor.fetchall():
                    unit = dict(row)
                    # Parse JSON fields
                    if unit['layout_config']:
                        try:
                            unit['layout_config'] = json.loads(unit['layout_config'])
                        except:
                            unit['layout_config'] = {}
                    units.append(unit)
                
                return units
        except Exception as e:
            print(f"Error getting units using template: {e}")
            return []

    # Quiz management methods
    @staticmethod
    def create_quiz_session(participant_name: str, participant_surname: str, quiz_type: str, 
                           total_questions: int, time_per_question: int) -> Optional[int]:
        """Create a new quiz session"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO quiz_sessions 
                    (participant_name, participant_surname, quiz_type, total_questions, time_per_question)
                    VALUES (?, ?, ?, ?, ?)
                ''', (participant_name, participant_surname, quiz_type, total_questions, time_per_question))
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            print(f"Error creating quiz session: {e}")
            return None

    @staticmethod
    def get_available_naval_units_for_quiz(quiz_type: str) -> List[Dict]:
        """Get naval units that can be used for quiz questions based on quiz type"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                if quiz_type == 'name_to_class':
                    # Need units with name and class
                    cursor.execute('''
                        SELECT * FROM naval_units 
                        WHERE name IS NOT NULL AND name != '' 
                        AND unit_class IS NOT NULL AND unit_class != ''
                        AND silhouette_path IS NOT NULL
                    ''')
                elif quiz_type == 'nation_to_class':
                    # Need units with nation and class
                    cursor.execute('''
                        SELECT * FROM naval_units 
                        WHERE nation IS NOT NULL AND nation != '' 
                        AND unit_class IS NOT NULL AND unit_class != ''
                        AND silhouette_path IS NOT NULL
                    ''')
                elif quiz_type == 'class_to_flag':
                    # Need units with class and flag
                    cursor.execute('''
                        SELECT * FROM naval_units 
                        WHERE unit_class IS NOT NULL AND unit_class != ''
                        AND (flag_path IS NOT NULL OR 
                             (layout_config IS NOT NULL AND layout_config LIKE '%flag%'))
                        AND silhouette_path IS NOT NULL
                    ''')
                else:
                    return []
                
                units = []
                for row in cursor.fetchall():
                    unit = dict(row)
                    if unit['layout_config']:
                        try:
                            unit['layout_config'] = json.loads(unit['layout_config'])
                        except:
                            unit['layout_config'] = {}
                    units.append(unit)
                
                return units
        except Exception as e:
            print(f"Error getting available units for quiz: {e}")
            return []

    @staticmethod
    def generate_quiz_questions(session_id: int, quiz_type: str, total_questions: int) -> bool:
        """Generate questions for a quiz session"""
        import random
        
        try:
            # Get available units for this quiz type
            available_units = SimpleDatabase.get_available_naval_units_for_quiz(quiz_type)
            
            if len(available_units) < 4:
                print(f"Not enough units available for quiz type {quiz_type} (need at least 4, have {len(available_units)})")
                return False
            
            # Select random units for questions
            selected_units = random.sample(available_units, min(total_questions, len(available_units)))
            
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                for i, unit in enumerate(selected_units, 1):
                    # Generate answer options based on quiz type
                    if quiz_type == 'name_to_class':
                        correct_answer = unit['unit_class']
                        # Get other classes as wrong options
                        cursor.execute('''
                            SELECT DISTINCT unit_class FROM naval_units 
                            WHERE unit_class != ? AND unit_class IS NOT NULL AND unit_class != ''
                            ORDER BY RANDOM() LIMIT 3
                        ''', (correct_answer,))
                        wrong_options = [row[0] for row in cursor.fetchall()]
                        
                    elif quiz_type == 'nation_to_class':
                        correct_answer = unit['unit_class']
                        # Get other classes from same or different nations
                        cursor.execute('''
                            SELECT DISTINCT unit_class FROM naval_units 
                            WHERE unit_class != ? AND unit_class IS NOT NULL AND unit_class != ''
                            ORDER BY RANDOM() LIMIT 3
                        ''', (correct_answer,))
                        wrong_options = [row[0] for row in cursor.fetchall()]
                        
                    elif quiz_type == 'class_to_flag':
                        # For flag quiz, the correct answer is the nation
                        correct_answer = unit['nation'] or 'Unknown'
                        # Get other nations as wrong options
                        cursor.execute('''
                            SELECT DISTINCT nation FROM naval_units 
                            WHERE nation != ? AND nation IS NOT NULL AND nation != ''
                            ORDER BY RANDOM() LIMIT 3
                        ''', (correct_answer,))
                        wrong_options = [row[0] for row in cursor.fetchall()]
                    
                    # Ensure we have exactly 3 wrong options
                    while len(wrong_options) < 3:
                        wrong_options.append(f"Option {len(wrong_options) + 1}")
                    
                    wrong_options = wrong_options[:3]
                    
                    # Create all 4 options and shuffle them
                    all_options = [correct_answer] + wrong_options
                    random.shuffle(all_options)
                    
                    # Insert question
                    cursor.execute('''
                        INSERT INTO quiz_questions 
                        (session_id, question_number, question_type, naval_unit_id, correct_answer,
                         option_a, option_b, option_c, option_d)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (session_id, i, quiz_type, unit['id'], correct_answer,
                          all_options[0], all_options[1], all_options[2], all_options[3]))
                
                conn.commit()
                return True
                
        except Exception as e:
            print(f"Error generating quiz questions: {e}")
            return False

    @staticmethod
    def get_quiz_session(session_id: int) -> Optional[Dict]:
        """Get quiz session details"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM quiz_sessions WHERE id = ?', (session_id,))
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as e:
            print(f"Error getting quiz session: {e}")
            return None

    @staticmethod
    def get_quiz_question(session_id: int, question_number: int) -> Optional[Dict]:
        """Get a specific question from a quiz session"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT qq.*, nu.name, nu.unit_class, nu.nation, nu.silhouette_path, nu.flag_path, nu.layout_config
                    FROM quiz_questions qq
                    JOIN naval_units nu ON qq.naval_unit_id = nu.id
                    WHERE qq.session_id = ? AND qq.question_number = ?
                ''', (session_id, question_number))
                
                row = cursor.fetchone()
                if row:
                    question = dict(row)
                    if question['layout_config']:
                        try:
                            question['layout_config'] = json.loads(question['layout_config'])
                        except:
                            question['layout_config'] = {}
                    return question
                return None
        except Exception as e:
            print(f"Error getting quiz question: {e}")
            return None

    @staticmethod
    def submit_quiz_answer(session_id: int, question_number: int, user_answer: str) -> bool:
        """Submit answer for a quiz question"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Get the correct answer
                cursor.execute('''
                    SELECT correct_answer FROM quiz_questions 
                    WHERE session_id = ? AND question_number = ?
                ''', (session_id, question_number))
                
                result = cursor.fetchone()
                if not result:
                    return False
                
                correct_answer = result[0]
                is_correct = user_answer.strip().lower() == correct_answer.strip().lower()
                
                # Update the question with user's answer
                cursor.execute('''
                    UPDATE quiz_questions 
                    SET user_answer = ?, is_correct = ?, answered_at = CURRENT_TIMESTAMP
                    WHERE session_id = ? AND question_number = ?
                ''', (user_answer, is_correct, session_id, question_number))
                
                # Update session stats if this is correct
                if is_correct:
                    cursor.execute('''
                        UPDATE quiz_sessions 
                        SET correct_answers = correct_answers + 1
                        WHERE id = ?
                    ''', (session_id,))
                
                conn.commit()
                return True
        except Exception as e:
            print(f"Error submitting quiz answer: {e}")
            return False

    @staticmethod
    def complete_quiz_session(session_id: int) -> bool:
        """Mark quiz session as completed and calculate final score"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Get session details
                cursor.execute('''
                    SELECT total_questions, correct_answers FROM quiz_sessions WHERE id = ?
                ''', (session_id,))
                
                result = cursor.fetchone()
                if not result:
                    return False
                
                total_questions, correct_answers = result
                
                # Calculate score on 1-30 scale
                if total_questions > 0:
                    percentage = (correct_answers / total_questions) * 100
                    # Convert to 1-30 scale (18 is passing grade)
                    score = max(1, min(30, round(1 + (percentage / 100) * 29)))
                else:
                    score = 1
                
                # Update session
                cursor.execute('''
                    UPDATE quiz_sessions 
                    SET status = 'completed', score = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (score, session_id))
                
                conn.commit()
                return True
        except Exception as e:
            print(f"Error completing quiz session: {e}")
            return False

    @staticmethod
    def get_quiz_history(limit: int = 50) -> List[Dict]:
        """Get quiz session history"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM quiz_sessions 
                    WHERE status = 'completed'
                    ORDER BY completed_at DESC 
                    LIMIT ?
                ''', (limit,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error getting quiz history: {e}")
            return []

    @staticmethod
    def get_nations_with_units() -> List[str]:
        """Get list of nations that have naval units"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT DISTINCT nation FROM naval_units 
                    WHERE nation IS NOT NULL AND nation != ''
                    ORDER BY nation
                ''')
                return [row[0] for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error getting nations with units: {e}")
            return []

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
                print("Added notes column to naval_units table")
                
            # Add current_template_id column if it doesn't exist
            if 'current_template_id' not in columns:
                cursor.execute("ALTER TABLE naval_units ADD COLUMN current_template_id TEXT DEFAULT 'naval-card-standard'")
                conn.commit()
                print("Added current_template_id column to naval_units table")
                
            # Create unit_template_states table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS unit_template_states (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    unit_id INTEGER NOT NULL,
                    template_id TEXT NOT NULL,
                    element_states TEXT,  -- JSON string with element positions and visibility
                    canvas_config TEXT,   -- JSON string with canvas settings for this template
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (unit_id) REFERENCES naval_units (id) ON DELETE CASCADE,
                    UNIQUE(unit_id, template_id)
                )
            ''')
            conn.commit()
            print("Created unit_template_states table")
    except Exception as e:
        print(f"Migration error: {e}")

# Run migrations and create default admin
migrate_database()
create_default_admin()