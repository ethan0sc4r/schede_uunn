# REPORT DETTAGLIATO - MIGLIORIE AL CODICE

## 1. PROBLEMI CRITICI DA RISOLVERE IMMEDIATAMENTE

### A. SICUREZZA - VULNERABILITÀ CRITICHE

**PROBLEMA 1: Secret Key Hardcoded**
```python
# PROBLEMA ATTUALE (simple_main.py:53)
SECRET_KEY = "your-secret-key-here"  # ❌ CRITICO!

# SOLUZIONE IMMEDIATA
import os
from cryptography.fernet import Fernet

def get_secret_key():
    secret_key = os.environ.get("SECRET_KEY")
    if not secret_key:
        # Generate and save new key for development
        if os.environ.get("ENVIRONMENT") == "development":
            secret_key = Fernet.generate_key().decode()
            print(f"⚠️  Generated new SECRET_KEY: {secret_key}")
            print("⚠️  Save this to your environment variables!")
        else:
            raise ValueError("SECRET_KEY environment variable must be set in production")
    return secret_key

SECRET_KEY = get_secret_key()
```

**PROBLEMA 2: Password Hashing Debole**
```python
# PROBLEMA ATTUALE (simple_database.py:161-163)
def hash_password(password: str) -> str:
    """Hash a password using SHA256"""  # ❌ Troppo debole!
    return hashlib.sha256(password.encode()).hexdigest()

# SOLUZIONE CON BCRYPT
import bcrypt

@staticmethod
def hash_password(password: str) -> str:
    """Hash a password using bcrypt with salt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

@staticmethod
def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its bcrypt hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
```

**PROBLEMA 3: Mancanza Rate Limiting**
```python
# SOLUZIONE COMPLETA
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Applicazione rate limiting
@app.post("/api/auth/login")
@limiter.limit("5/minute")  # Max 5 tentativi login per minuto
async def login(request: Request, user_credentials: UserLogin):
    # existing login logic
    pass

@app.post("/api/auth/register") 
@limiter.limit("3/hour")  # Max 3 registrazioni per ora
async def register(request: Request, user_data: UserRegister):
    # existing register logic
    pass

@app.post("/api/upload-image")
@limiter.limit("10/minute")  # Max 10 upload per minuto
async def upload_image(request: Request, image: UploadFile = File(...)):
    # existing upload logic
    pass
```

**PROBLEMA 4: Input Sanitization Mancante**
```python
# SOLUZIONE PER SANITIZZAZIONE INPUT
import bleach
from html import escape

def sanitize_text_input(text: str) -> str:
    """Sanitizza input testuale rimuovendo HTML pericoloso"""
    if not text:
        return ""
    
    # Remove HTML tags completamente per campi nome/classe
    cleaned = bleach.clean(text, tags=[], strip=True)
    
    # Escape caratteri speciali
    escaped = escape(cleaned)
    
    return escaped.strip()

def sanitize_html_input(html: str) -> str:
    """Sanitizza HTML permettendo solo tag sicuri"""
    allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li']
    allowed_attributes = {}
    
    return bleach.clean(html, tags=allowed_tags, attributes=allowed_attributes, strip=True)

# Applicazione nei Pydantic models
class NavalUnitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    unit_class: str = Field(..., min_length=1, max_length=100)
    nation: Optional[str] = Field(None, max_length=100)
    
    @validator('name', 'unit_class', 'nation')
    def sanitize_text_fields(cls, v):
        if v:
            return sanitize_text_input(v)
        return v
```

**PROBLEMA 5: File Upload Security**
```python
# MIGLIORAMENTI SICUREZZA UPLOAD
import magic
from PIL import Image
import hashlib

ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_IMAGE_DIMENSIONS = (4096, 4096)

def validate_uploaded_file(file: UploadFile) -> dict:
    """Validazione completa file uploadato"""
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large. Max size: {MAX_FILE_SIZE} bytes")
    
    # Read file content for validation
    content = file.file.read()
    file.file.seek(0)  # Reset for later use
    
    # Validate MIME type using magic numbers
    detected_mime = magic.from_buffer(content, mime=True)
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, f"Invalid file type: {detected_mime}")
    
    # Additional validation for images
    if detected_mime.startswith('image/'):
        try:
            with Image.open(io.BytesIO(content)) as img:
                if img.size[0] > MAX_IMAGE_DIMENSIONS[0] or img.size[1] > MAX_IMAGE_DIMENSIONS[1]:
                    raise HTTPException(400, f"Image too large. Max dimensions: {MAX_IMAGE_DIMENSIONS}")
                
                # Convert to RGB if necessary (removes potential malicious data)
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
        except Exception as e:
            raise HTTPException(400, f"Invalid image file: {str(e)}")
    
    # Generate secure filename
    file_hash = hashlib.md5(content).hexdigest()[:8]
    file_extension = os.path.splitext(file.filename)[1].lower()
    secure_filename = f"{file_hash}_{int(time.time())}{file_extension}"
    
    return {
        'content': content,
        'mime_type': detected_mime,
        'size': file_size,
        'secure_filename': secure_filename
    }

@app.post("/api/upload-image")
async def upload_image_secure(image: UploadFile = File(...), subfolder: str = Form("general")):
    """Upload sicuro con validazione completa"""
    
    # Validate file
    file_info = validate_uploaded_file(image)
    
    # Create secure path
    safe_subfolder = "".join(c for c in subfolder if c.isalnum() or c in ('-', '_'))
    full_path = os.path.join(UPLOAD_DIR, safe_subfolder, file_info['secure_filename'])
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    # Write file securely
    with open(full_path, "wb") as f:
        f.write(file_info['content'])
    
    # Set restrictive permissions
    os.chmod(full_path, 0o644)
    
    relative_path = f"{safe_subfolder}/{file_info['secure_filename']}"
    return {"file_path": relative_path, "mime_type": file_info['mime_type']}
```

### B. GESTIONE ERRORI E LOGGING

**PROBLEMA: Logging Insufficiente**
```python
# CONFIGURAZIONE LOGGING STRUTTURATO
import logging
import sys
from datetime import datetime
import json
import traceback
from contextlib import asynccontextmanager

class StructuredFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'ip_address'):
            log_entry['ip_address'] = record.ip_address
            
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }
            
        return json.dumps(log_entry, ensure_ascii=False)

# Setup logging
def setup_logging():
    # Create logs directory
    os.makedirs("logs", exist_ok=True)
    
    # Configure root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(StructuredFormatter())
    logger.addHandler(console_handler)
    
    # File handler
    file_handler = logging.FileHandler("logs/app.log", encoding='utf-8')
    file_handler.setFormatter(StructuredFormatter())
    logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = logging.FileHandler("logs/error.log", encoding='utf-8')
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(StructuredFormatter())
    logger.addHandler(error_handler)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid4())
    request.state.request_id = request_id
    
    start_time = time.time()
    
    # Log request
    logger.info("Request started", extra={
        "request_id": request_id,
        "method": request.method,
        "url": str(request.url),
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent", "")
    })
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log response
        logger.info("Request completed", extra={
            "request_id": request_id,
            "status_code": response.status_code,
            "process_time": round(process_time, 4)
        })
        
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        
        # Log error
        logger.error("Request failed", extra={
            "request_id": request_id,
            "process_time": round(process_time, 4),
            "error": str(e)
        }, exc_info=True)
        
        raise

# Business logic logging
def log_business_event(event_type: str, data: dict, user_id: int = None):
    """Log eventi business importanti"""
    logger.info(f"Business event: {event_type}", extra={
        "event_type": event_type,
        "event_data": data,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat()
    })

# Usage esempio
@app.post("/api/units")
async def create_naval_unit(unit: NavalUnitCreate, user: dict = Depends(get_current_user)):
    try:
        unit_id = SimpleDatabase.create_naval_unit(
            name=unit.name,
            unit_class=unit.unit_class,
            created_by=user["id"]
        )
        
        # Log business event
        log_business_event("unit_created", {
            "unit_id": unit_id,
            "unit_name": unit.name,
            "unit_class": unit.unit_class
        }, user["id"])
        
        return {"message": "Naval unit created", "id": unit_id}
        
    except Exception as e:
        logger.error("Failed to create naval unit", extra={
            "user_id": user["id"],
            "unit_data": unit.dict(),
            "error": str(e)
        }, exc_info=True)
        raise
```

**PROBLEMA: Exception Handling Generico**
```python
# EXCEPTION HANDLERS SPECIFICI
from fastapi.responses import JSONResponse
import uuid
from datetime import datetime

class NavalUnitsException(Exception):
    def __init__(self, message: str, status_code: int = 500, details: dict = None, error_code: str = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.error_code = error_code or "GENERIC_ERROR"
        super().__init__(self.message)

class ValidationException(NavalUnitsException):
    def __init__(self, field: str, message: str, value=None):
        super().__init__(
            message=f"Validation error on field '{field}': {message}",
            status_code=400,
            error_code="VALIDATION_ERROR",
            details={"field": field, "value": value, "validation_message": message}
        )

class UnitNotFoundException(NavalUnitsException):
    def __init__(self, unit_id: int):
        super().__init__(
            message=f"Naval unit with ID {unit_id} not found",
            status_code=404,
            error_code="UNIT_NOT_FOUND",
            details={"unit_id": unit_id}
        )

class TemplateNotFoundException(NavalUnitsException):
    def __init__(self, template_id: str):
        super().__init__(
            message=f"Template with ID {template_id} not found",
            status_code=404,
            error_code="TEMPLATE_NOT_FOUND",
            details={"template_id": template_id}
        )

class InsufficientPermissionsException(NavalUnitsException):
    def __init__(self, action: str, resource: str):
        super().__init__(
            message=f"Insufficient permissions to {action} {resource}",
            status_code=403,
            error_code="INSUFFICIENT_PERMISSIONS",
            details={"action": action, "resource": resource}
        )

class DatabaseException(NavalUnitsException):
    def __init__(self, operation: str, details: dict = None):
        super().__init__(
            message=f"Database error during {operation}",
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details or {}
        )

@app.exception_handler(NavalUnitsException)
async def naval_units_exception_handler(request: Request, exc: NavalUnitsException):
    error_id = str(uuid4())
    
    logger.error(
        f"NavalUnitsException: {exc.message}",
        extra={
            "error_id": error_id,
            "error_code": exc.error_code,
            "details": exc.details,
            "status_code": exc.status_code,
            "request_id": getattr(request.state, 'request_id', None),
            "user_id": getattr(request.state, 'user_id', None)
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "id": error_id,
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    error_id = str(uuid4())
    
    # Convert Pydantic validation errors to our format
    validation_errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"])
        validation_errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"],
            "input": error.get("input")
        })
    
    logger.warning(
        "Validation error",
        extra={
            "error_id": error_id,
            "validation_errors": validation_errors,
            "request_id": getattr(request.state, 'request_id', None)
        }
    )
    
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "id": error_id,
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {"validation_errors": validation_errors},
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

# Generic exception handler per catch-all
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    error_id = str(uuid4())
    
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={
            "error_id": error_id,
            "exception_type": type(exc).__name__,
            "request_id": getattr(request.state, 'request_id', None)
        },
        exc_info=True
    )
    
    # Don't expose internal errors in production
    if os.environ.get("ENVIRONMENT") == "production":
        message = "An internal error occurred"
        details = {}
    else:
        message = str(exc)
        details = {"exception_type": type(exc).__name__}
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "id": error_id,
                "code": "INTERNAL_ERROR",
                "message": message,
                "details": details,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )
```

### C. VALIDAZIONE E SANITIZZAZIONE INPUT

**PROBLEMA: Validazione Insufficiente**
```python
# VALIDAZIONE PYDANTIC POTENZIATA
from pydantic import BaseModel, validator, Field, root_validator
from typing import List, Optional, Union
import re
from datetime import datetime

class CharacteristicCreate(BaseModel):
    characteristic_name: str = Field(..., min_length=1, max_length=100, description="Characteristic name")
    characteristic_value: str = Field(..., min_length=1, max_length=500, description="Characteristic value")
    order_index: int = Field(0, ge=0, le=1000, description="Display order")
    
    @validator('characteristic_name', 'characteristic_value')
    def sanitize_text(cls, v):
        if v:
            return sanitize_text_input(v)
        return v

class NavalUnitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Unit name")
    unit_class: str = Field(..., min_length=1, max_length=100, description="Unit class")  
    nation: Optional[str] = Field(None, max_length=100, description="Nation")
    background_color: str = Field("#ffffff", regex=r"^#[0-9A-Fa-f]{6}$", description="Background color hex")
    characteristics: List[CharacteristicCreate] = Field(default_factory=list, max_items=50)
    notes: Optional[str] = Field(None, max_length=10000, description="Additional notes")
    
    @validator('name', 'unit_class', 'nation')
    def validate_and_sanitize_text(cls, v):
        if v:
            # Remove dangerous characters
            if re.search(r'[<>"\'\&\x00-\x1f\x7f-\x9f]', v):
                raise ValueError('Contains invalid characters')
            return sanitize_text_input(v)
        return v
    
    @validator('notes')
    def validate_notes(cls, v):
        if v:
            # Allow basic HTML in notes but sanitize
            return sanitize_html_input(v)
        return v
    
    @validator('characteristics')
    def validate_characteristics(cls, v):
        if len(v) > 50:
            raise ValueError('Too many characteristics (max 50)')
        
        # Check for duplicate names
        names = [char.characteristic_name.lower() for char in v]
        if len(names) != len(set(names)):
            raise ValueError('Duplicate characteristic names not allowed')
        
        return v
    
    @root_validator
    def validate_complete_data(cls, values):
        # Cross-field validation
        name = values.get('name', '').lower()
        unit_class = values.get('unit_class', '').lower()
        
        # Prevent confusing combinations
        if name and unit_class and name == unit_class:
            raise ValueError('Name and class cannot be identical')
        
        return values

class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Template name")
    description: Optional[str] = Field(None, max_length=500, description="Template description")
    elements: List[dict] = Field(..., min_items=1, max_items=100, description="Template elements")
    canvasWidth: int = Field(..., ge=100, le=5000, description="Canvas width in pixels")
    canvasHeight: int = Field(..., ge=100, le=5000, description="Canvas height in pixels")
    canvasBackground: str = Field("#ffffff", regex=r"^#[0-9A-Fa-f]{6}$")
    canvasBorderWidth: int = Field(2, ge=0, le=20)
    canvasBorderColor: str = Field("#000000", regex=r"^#[0-9A-Fa-f]{6}$")
    logoVisible: bool = Field(True)
    flagVisible: bool = Field(True) 
    silhouetteVisible: bool = Field(True)
    
    @validator('name', 'description')
    def sanitize_text_fields(cls, v):
        if v:
            return sanitize_text_input(v)
        return v
    
    @validator('elements')
    def validate_elements(cls, v):
        valid_types = {'text', 'image', 'logo', 'flag', 'silhouette', 'table', 'unit_name', 'unit_class'}
        required_fields = {'id', 'type', 'x', 'y', 'width', 'height'}
        
        element_ids = set()
        
        for i, element in enumerate(v):
            # Check required fields
            missing_fields = required_fields - set(element.keys())
            if missing_fields:
                raise ValueError(f"Element {i}: missing required fields: {missing_fields}")
            
            # Validate type
            if element['type'] not in valid_types:
                raise ValueError(f"Element {i}: invalid type '{element['type']}'")
            
            # Check for duplicate IDs
            element_id = element['id']
            if element_id in element_ids:
                raise ValueError(f"Duplicate element ID: {element_id}")
            element_ids.add(element_id)
            
            # Validate coordinates and dimensions
            for field in ['x', 'y', 'width', 'height']:
                value = element[field]
                if not isinstance(value, (int, float)) or value < 0:
                    raise ValueError(f"Element {i}: {field} must be a positive number")
            
            # Validate text content if present
            if 'content' in element and element['content']:
                element['content'] = sanitize_text_input(str(element['content']))
        
        return v
    
    @root_validator
    def validate_canvas_dimensions(cls, values):
        width = values.get('canvasWidth')
        height = values.get('canvasHeight')
        elements = values.get('elements', [])
        
        # Check if elements fit within canvas
        for element in elements:
            if element['x'] + element['width'] > width:
                raise ValueError(f"Element {element['id']} extends beyond canvas width")
            if element['y'] + element['height'] > height:
                raise ValueError(f"Element {element['id']} extends beyond canvas height")
        
        return values

# Search parameters validation
class AdvancedSearchParams(BaseModel):
    query: Optional[str] = Field(None, max_length=200)
    search_type: str = Field("all", regex=r"^(all|name|class|nation)$")
    nation_filter: Optional[List[str]] = Field(None, max_items=50)
    class_filter: Optional[List[str]] = Field(None, max_items=50)
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = Field("created_at", regex=r"^(name|created_at|updated_at|unit_class)$")
    sort_order: str = Field("desc", regex=r"^(asc|desc)$")
    page: int = Field(1, ge=1, le=1000)
    limit: int = Field(20, ge=1, le=100)
    
    @validator('query')
    def sanitize_query(cls, v):
        if v:
            # Remove SQL injection attempts and special characters
            sanitized = re.sub(r'[;\'"\\%_]', '', v)
            return sanitize_text_input(sanitized)
        return v
    
    @validator('nation_filter', 'class_filter')
    def sanitize_filters(cls, v):
        if v:
            return [sanitize_text_input(item) for item in v if item]
        return v
    
    @root_validator
    def validate_date_range(cls, values):
        date_from = values.get('date_from')
        date_to = values.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise ValueError('date_from must be before date_to')
        
        # Prevent overly broad date ranges
        if date_from and date_to:
            days_diff = (date_to - date_from).days
            if days_diff > 3650:  # 10 years
                raise ValueError('Date range too broad (max 10 years)')
        
        return values
```

## 2. OTTIMIZZAZIONI PERFORMANCE

### A. DATABASE OTTIMIZZAZIONI

**PROBLEMA: Query N+1 e Missing Indexes**
```python
# INDEXES CRITICI DA AGGIUNGERE
class DatabaseOptimizer:
    @staticmethod
    def create_indexes():
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Indexes per ricerca frequente
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_units_name ON naval_units(name)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_units_class ON naval_units(unit_class)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_units_nation ON naval_units(nation)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_units_template ON naval_units(current_template_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_units_created_at ON naval_units(created_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_units_created_by ON naval_units(created_by)")
            
            # Composite index per ricerca avanzata
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_units_search 
                ON naval_units(name, unit_class, nation, created_at)
            """)
            
            # Index per join frequenti
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_characteristics_unit ON unit_characteristics(naval_unit_id, order_index)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_group_memberships ON group_memberships(group_id, naval_unit_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_template_states ON unit_template_states(unit_id, template_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by, is_default)")
            
            # Index per autenticazione
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)")
            
            conn.commit()
            print("✅ Database indexes created successfully")

# QUERY OPTIMIZATION CON PREPARED STATEMENTS
class OptimizedDatabase:
    @staticmethod
    def get_naval_units_optimized(skip: int = 0, limit: int = 100, search_params: dict = None) -> List[Dict]:
        """Get naval units with optimized single query"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Base query with proper joins
            base_query = '''
                SELECT 
                    nu.id, nu.name, nu.unit_class, nu.nation, nu.logo_path,
                    nu.silhouette_path, nu.flag_path, nu.background_color,
                    nu.layout_config, nu.current_template_id, nu.created_at,
                    nu.updated_at, nu.notes,
                    t.name as template_name,
                    COUNT(uc.id) as characteristics_count,
                    GROUP_CONCAT(
                        uc.characteristic_name || ':' || uc.characteristic_value || ':' || uc.order_index, 
                        '|'
                    ) as characteristics_data
                FROM naval_units nu
                LEFT JOIN templates t ON nu.current_template_id = t.id
                LEFT JOIN unit_characteristics uc ON nu.id = uc.naval_unit_id
            '''
            
            where_conditions = []
            params = []
            
            # Add search filters if provided
            if search_params:
                if search_params.get('query'):
                    where_conditions.append("""
                        (nu.name LIKE ? OR nu.unit_class LIKE ? OR nu.nation LIKE ?)
                    """)
                    query_param = f"%{search_params['query']}%"
                    params.extend([query_param, query_param, query_param])
                
                if search_params.get('nation_filter'):
                    placeholders = ','.join(['?' for _ in search_params['nation_filter']])
                    where_conditions.append(f"nu.nation IN ({placeholders})")
                    params.extend(search_params['nation_filter'])
                
                if search_params.get('class_filter'):
                    placeholders = ','.join(['?' for _ in search_params['class_filter']])
                    where_conditions.append(f"nu.unit_class IN ({placeholders})")
                    params.extend(search_params['class_filter'])
                
                if search_params.get('date_from'):
                    where_conditions.append("nu.created_at >= ?")
                    params.append(search_params['date_from'])
                
                if search_params.get('date_to'):
                    where_conditions.append("nu.created_at <= ?")
                    params.append(search_params['date_to'])
            
            # Construct final query
            if where_conditions:
                query = base_query + " WHERE " + " AND ".join(where_conditions)
            else:
                query = base_query
            
            query += " GROUP BY nu.id"
            
            # Add sorting
            sort_by = search_params.get('sort_by', 'created_at') if search_params else 'created_at'
            sort_order = search_params.get('sort_order', 'desc') if search_params else 'desc'
            query += f" ORDER BY nu.{sort_by} {sort_order.upper()}"
            
            # Add pagination
            query += " LIMIT ? OFFSET ?"
            params.extend([limit, skip])
            
            cursor.execute(query, params)
            
            units = []
            for row in cursor.fetchall():
                unit = dict(row)
                
                # Parse characteristics from concatenated string
                if unit['characteristics_data']:
                    characteristics = []
                    for char_data in unit['characteristics_data'].split('|'):
                        if char_data:
                            try:
                                name, value, order_idx = char_data.split(':', 2)
                                characteristics.append({
                                    'characteristic_name': name,
                                    'characteristic_value': value,
                                    'order_index': int(order_idx)
                                })
                            except ValueError:
                                continue
                    unit['characteristics'] = sorted(characteristics, key=lambda x: x['order_index'])
                else:
                    unit['characteristics'] = []
                
                # Parse JSON fields safely
                if unit['layout_config']:
                    try:
                        unit['layout_config'] = json.loads(unit['layout_config'])
                    except (json.JSONDecodeError, TypeError):
                        unit['layout_config'] = {}
                
                # Remove concatenated data field
                del unit['characteristics_data']
                
                units.append(unit)
            
            return units
    
    @staticmethod
    def get_unit_with_full_details(unit_id: int) -> Optional[Dict]:
        """Get single unit with all related data in one query"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Single comprehensive query
            cursor.execute('''
                SELECT 
                    nu.*,
                    t.name as template_name,
                    t.description as template_description,
                    t.elements as template_elements,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    GROUP_CONCAT(
                        uc.id || ':' || uc.characteristic_name || ':' || 
                        uc.characteristic_value || ':' || uc.order_index, 
                        '|'
                    ) as characteristics_data
                FROM naval_units nu
                LEFT JOIN templates t ON nu.current_template_id = t.id
                LEFT JOIN users u ON nu.created_by = u.id
                LEFT JOIN unit_characteristics uc ON nu.id = uc.naval_unit_id
                WHERE nu.id = ?
                GROUP BY nu.id
            ''', (unit_id,))
            
            row = cursor.fetchone()
            if not row:
                return None
            
            unit = dict(row)
            
            # Parse characteristics
            characteristics = []
            if unit['characteristics_data']:
                for char_data in unit['characteristics_data'].split('|'):
                    if char_data:
                        try:
                            char_id, name, value, order_idx = char_data.split(':', 3)
                            characteristics.append({
                                'id': int(char_id),
                                'characteristic_name': name,
                                'characteristic_value': value,
                                'order_index': int(order_idx)
                            })
                        except ValueError:
                            continue
            
            unit['characteristics'] = sorted(characteristics, key=lambda x: x['order_index'])
            
            # Parse JSON fields
            for json_field in ['layout_config', 'template_elements']:
                if unit.get(json_field):
                    try:
                        unit[json_field] = json.loads(unit[json_field])
                    except (json.JSONDecodeError, TypeError):
                        unit[json_field] = {} if json_field == 'layout_config' else []
            
            # Clean up
            del unit['characteristics_data']
            
            return unit
```

**CACHING STRATEGICO**
```python
import redis
from functools import wraps
import pickle
import hashlib
import asyncio
from typing import Any, Optional, Callable

# Redis connection with error handling
def get_redis_client():
    try:
        client = redis.Redis(
            host=os.environ.get('REDIS_HOST', 'localhost'),
            port=int(os.environ.get('REDIS_PORT', 6379)),
            db=0,
            decode_responses=False,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30
        )
        # Test connection
        client.ping()
        return client
    except (redis.ConnectionError, redis.TimeoutError):
        logger.warning("Redis connection failed, caching disabled")
        return None

redis_client = get_redis_client()

class CacheManager:
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self.local_cache = {}  # Fallback in-memory cache
        self.max_local_cache_size = 1000
    
    def _generate_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate consistent cache key"""
        key_data = f"{prefix}:{args}:{sorted(kwargs.items())}"
        return f"naval_units:{hashlib.md5(key_data.encode()).hexdigest()}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache with fallback"""
        try:
            # Try Redis first
            if self.redis_client:
                cached_data = self.redis_client.get(key)
                if cached_data:
                    return pickle.loads(cached_data)
            
            # Fallback to local cache
            return self.local_cache.get(key)
            
        except Exception as e:
            logger.warning(f"Cache get error for key {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, expire_seconds: int = 300) -> bool:
        """Set value in cache with fallback"""
        try:
            # Try Redis first
            if self.redis_client:
                serialized = pickle.dumps(value)
                success = self.redis_client.setex(key, expire_seconds, serialized)
                if success:
                    return True
            
            # Fallback to local cache
            if len(self.local_cache) >= self.max_local_cache_size:
                # Simple LRU: remove oldest half
                keys_to_remove = list(self.local_cache.keys())[:len(self.local_cache)//2]
                for k in keys_to_remove:
                    del self.local_cache[k]
            
            self.local_cache[key] = value
            return True
            
        except Exception as e:
            logger.warning(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete from cache"""
        try:
            success = False
            
            if self.redis_client:
                success = bool(self.redis_client.delete(key))
            
            if key in self.local_cache:
                del self.local_cache[key]
                success = True
            
            return success
            
        except Exception as e:
            logger.warning(f"Cache delete error for key {key}: {e}")
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        try:
            count = 0
            
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    count += self.redis_client.delete(*keys)
            
            # Local cache pattern matching (simple)
            local_keys_to_delete = [k for k in self.local_cache.keys() if pattern.replace('*', '') in k]
            for k in local_keys_to_delete:
                del self.local_cache[k]
                count += 1
            
            return count
            
        except Exception as e:
            logger.warning(f"Cache invalidate pattern error for {pattern}: {e}")
            return 0

# Global cache manager
cache_manager = CacheManager(redis_client)

def cache_result(expire_seconds: int = 300, key_prefix: str = "default"):
    """Decorator per cachare risultati funzioni"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache_manager._generate_cache_key(f"{key_prefix}:{func.__name__}", *args, **kwargs)
            
            # Try cache first
            cached_result = cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {func.__name__}")
                return cached_result
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            cache_manager.set(cache_key, result, expire_seconds)
            logger.debug(f"Cache set for {func.__name__}")
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache_manager._generate_cache_key(f"{key_prefix}:{func.__name__}", *args, **kwargs)
            
            # Try cache first
            cached_result = cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {func.__name__}")
                return cached_result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            cache_manager.set(cache_key, result, expire_seconds)
            logger.debug(f"Cache set for {func.__name__}")
            
            return result
        
        # Return appropriate wrapper based on function type
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator

# Cached functions
@cache_result(expire_seconds=600, key_prefix="templates")
def get_templates_cached(user_id: int) -> List[Dict]:
    return SimpleDatabase.get_templates(user_id)

@cache_result(expire_seconds=300, key_prefix="units")
def get_naval_unit_cached(unit_id: int) -> Optional[Dict]:
    return OptimizedDatabase.get_unit_with_full_details(unit_id)

@cache_result(expire_seconds=180, key_prefix="search")
def search_units_cached(search_params: dict) -> List[Dict]:
    return OptimizedDatabase.get_naval_units_optimized(
        skip=search_params.get('skip', 0),
        limit=search_params.get('limit', 20),
        search_params=search_params
    )

# Cache invalidation helpers
def invalidate_unit_cache(unit_id: int):
    """Invalidate all cache entries related to a unit"""
    patterns = [
        f"naval_units:units:*{unit_id}*",
        f"naval_units:search:*",
        f"naval_units:default:get_naval_units*"
    ]
    
    for pattern in patterns:
        count = cache_manager.invalidate_pattern(pattern)
        logger.debug(f"Invalidated {count} cache entries for pattern: {pattern}")

def invalidate_template_cache(template_id: str, user_id: int):
    """Invalidate template-related cache"""
    patterns = [
        f"naval_units:templates:*{user_id}*",
        f"naval_units:templates:*{template_id}*",
        f"naval_units:units:*"  # Templates affect unit display
    ]
    
    for pattern in patterns:
        count = cache_manager.invalidate_pattern(pattern)
        logger.debug(f"Invalidated {count} cache entries for pattern: {pattern}")

# Updated API endpoints with caching
@app.get("/api/units/{unit_id}")
async def get_naval_unit(unit_id: int, user: dict = Depends(get_current_user)):
    unit = get_naval_unit_cached(unit_id)
    if not unit:
        raise UnitNotFoundException(unit_id)
    return unit

@app.put("/api/units/{unit_id}")
async def update_naval_unit(unit_id: int, unit: dict, user: dict = Depends(get_current_user)):
    try:
        success = SimpleDatabase.update_naval_unit(unit_id, **unit)
        
        if not success:
            raise UnitNotFoundException(unit_id)
        
        # Invalidate related cache
        invalidate_unit_cache(unit_id)
        
        # Log business event
        log_business_event("unit_updated", {
            "unit_id": unit_id,
            "updated_fields": list(unit.keys())
        }, user["id"])
        
        return {"message": "Naval unit updated successfully"}
        
    except Exception as e:
        logger.error(f"Failed to update unit {unit_id}", extra={
            "user_id": user["id"],
            "unit_data": unit,
            "error": str(e)
        }, exc_info=True)
        raise

@app.put("/api/templates/{template_id}")
async def update_template(template_id: str, template_data: dict, user: dict = Depends(get_current_user)):
    try:
        # Update template
        success = SimpleDatabase.update_template(template_id, template_data, user['id'])
        if not success:
            raise TemplateNotFoundException(template_id)
        
        # Get affected units
        affected_units = SimpleDatabase.get_units_using_template(template_id)
        
        # Update units using this template
        updated_units = []
        for unit in affected_units:
            try:
                updated_layout = unit.get('layout_config', {})
                updated_layout.update({
                    'canvasWidth': template_data.get('canvasWidth', 1123),
                    'canvasHeight': template_data.get('canvasHeight', 794),
                    'canvasBackground': template_data.get('canvasBackground', '#ffffff'),
                    'canvasBorderWidth': template_data.get('canvasBorderWidth', 2),
                    'canvasBorderColor': template_data.get('canvasBorderColor', '#000000'),
                    'templateId': template_id
                })
                
                if 'elements' in template_data:
                    updated_layout['elements'] = template_data['elements']
                
                SimpleDatabase.update_naval_unit(unit['id'], layout_config=updated_layout)
                updated_units.append(unit['id'])
                
                # Invalidate unit cache
                invalidate_unit_cache(unit['id'])
                
            except Exception as unit_error:
                logger.error(f"Failed to update unit {unit['id']} during template propagation", 
                           extra={"template_id": template_id, "error": str(unit_error)})
        
        # Invalidate template cache
        invalidate_template_cache(template_id, user['id'])
        
        # Log business event
        log_business_event("template_updated", {
            "template_id": template_id,
            "affected_units": len(affected_units),
            "successfully_updated": len(updated_units)
        }, user['id'])
        
        return {
            "message": "Template updated successfully",
            "units_updated": len(updated_units),
            "updated_unit_ids": updated_units
        }
        
    except Exception as e:
        logger.error(f"Failed to update template {template_id}", extra={
            "user_id": user['id'],
            "template_data": template_data,
            "error": str(e)
        }, exc_info=True)
        raise
```

### B. FRONTEND OTTIMIZZAZIONI

**PROBLEMA: Bundle Size e Performance**
```typescript
// CODE SPLITTING AVANZATO
import { lazy, Suspense, useMemo } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Lazy loading con preloading strategico
const CanvasEditor = lazy(() => 
  import('./components/CanvasEditor').then(module => ({
    default: module.CanvasEditor
  }))
);

const TemplateManager = lazy(() => 
  import('./components/TemplateManager').then(module => ({
    default: module.TemplateManager
  }))
);

const AnalyticsDashboard = lazy(() => 
  import('./pages/AnalyticsDashboard')
);

// Preload functions
const preloadCanvasEditor = () => import('./components/CanvasEditor');
const preloadTemplateManager = () => import('./components/TemplateManager');
const preloadAnalytics = () => import('./pages/AnalyticsDashboard');

// Loading components ottimizzati
const LoadingSpinner = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12', 
    large: 'h-16 w-16'
  };

  return (
    <div className="flex items-center justify-center h-64">
      <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`} />
    </div>
  );
};

// Error fallback
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
  <div className="flex flex-col items-center justify-center h-64 p-4">
    <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
    <p className="text-gray-600 mb-4 text-center">{error.message}</p>
    <button 
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Try again
    </button>
  </div>
);

// Preloadable navigation component
const PreloadableNavLink = ({ 
  to, 
  children, 
  preload,
  className = ""
}: { 
  to: string;
  children: React.ReactNode;
  preload: () => Promise<any>;
  className?: string;
}) => {
  const [preloaded, setPreloaded] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!preloaded) {
      preload().then(() => setPreloaded(true));
    }
  }, [preload, preloaded]);

  return (
    <Link 
      to={to} 
      onMouseEnter={handleMouseEnter}
      className={className}
    >
      {children}
    </Link>
  );
};

// Route configuration with error boundaries
const AppRoutes = () => (
  <Routes>
    <Route path="/units/:id/edit" element={
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<LoadingSpinner />}>
          <CanvasEditor />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="/templates" element={
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<LoadingSpinner />}>
          <TemplateManager />
        </Suspense>
      </ErrorBoundary>
    } />
  </Routes>
);

// Navigation with preloading
const Navigation = () => (
  <nav className="space-x-4">
    <PreloadableNavLink 
      to="/templates" 
      preload={preloadTemplateManager}
      className="hover:text-blue-600"
    >
      Templates
    </PreloadableNavLink>
    <PreloadableNavLink 
      to="/analytics" 
      preload={preloadAnalytics}
      className="hover:text-blue-600"
    >
      Analytics
    </PreloadableNavLink>
  </nav>
);
```

**VIRTUAL SCROLLING PER LISTE GRANDI**
```typescript
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { useMemo, useCallback, forwardRef } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  height: number;
  width?: number;
  renderItem: ({ index, style, data }: { 
    index: number; 
    style: React.CSSProperties; 
    data: T[];
  }) => React.ReactElement;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

function VirtualizedList<T>({ 
  items, 
  itemHeight, 
  height, 
  width = '100%',
  renderItem, 
  onScroll,
  className = ""
}: VirtualizedListProps<T>) {
  const itemData = useMemo(() => items, [items]);
  
  const handleScroll = useCallback(({ scrollTop }: { scrollTop: number }) => {
    onScroll?.(scrollTop);
  }, [onScroll]);

  // Use variable height list if itemHeight is a function
  const ListComponent = typeof itemHeight === 'function' ? VariableSizeList : List;
  
  const listProps = typeof itemHeight === 'function' 
    ? { itemSize: itemHeight as (index: number) => number }
    : { itemSize: itemHeight as number };

  return (
    <div className={className}>
      <ListComponent
        height={height}
        width={width}
        itemCount={items.length}
        itemData={itemData}
        onScroll={handleScroll}
        {...listProps}
      >
        {renderItem}
      </ListComponent>
    </div>
  );
}

// Optimized unit card component
const UnitCard = memo<{ unit: NavalUnit; onClick?: (unit: NavalUnit) => void }>(
  ({ unit, onClick }) => {
    const handleClick = useCallback(() => {
      onClick?.(unit);
    }, [unit, onClick]);

    const thumbnailUrl = useMemo(() => {
      return unit.logo_path ? getImageUrl(unit.logo_path) : null;
    }, [unit.logo_path]);

    return (
      <div 
        className="flex items-center p-4 border-b hover:bg-gray-50 cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex-shrink-0 w-16 h-16 mr-4">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={unit.name}
              className="w-full h-full object-cover rounded"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-500 text-xs">No Logo</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {unit.name}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {unit.unit_class} • {unit.nation || 'Unknown'}
          </p>
          <p className="text-xs text-gray-400">
            Created: {new Date(unit.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {unit.characteristics?.length || 0} chars
          </span>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.unit.id === nextProps.unit.id &&
      prevProps.unit.updated_at === nextProps.unit.updated_at
    );
  }
);

// Virtualized units list
const UnitsListVirtualized: React.FC<{
  units: NavalUnit[];
  onUnitClick: (unit: NavalUnit) => void;
  isLoading?: boolean;
}> = ({ units, onUnitClick, isLoading = false }) => {
  const renderUnitItem = useCallback(({ 
    index, 
    style, 
    data 
  }: { 
    index: number; 
    style: React.CSSProperties; 
    data: NavalUnit[];
  }) => (
    <div style={style}>
      <UnitCard 
        unit={data[index]} 
        onClick={onUnitClick}
      />
    </div>
  ), [onUnitClick]);

  // Calculate dynamic height based on unit content
  const getItemHeight = useCallback((index: number) => {
    const unit = units[index];
    // Base height + extra for long names/descriptions
    let height = 80;
    if (unit.name.length > 30) height += 20;
    if (unit.characteristics && unit.characteristics.length > 5) height += 20;
    return height;
  }, [units]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg font-medium">No units found</p>
        <p className="text-sm">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <VirtualizedList
      items={units}
      itemHeight={getItemHeight}
      height={600}
      renderItem={renderUnitItem}
      className="border rounded-lg bg-white"
    />
  );
};

// Search with debouncing and virtualization
const SearchableUnitsList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useState<AdvancedSearchParams>({
    query: '',
    page: 1,
    limit: 50
  });

  // Debounced search
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setSearchParams(prev => ({
      ...prev,
      query: debouncedQuery,
      page: 1 // Reset to first page on new search
    }));
  }, [debouncedQuery]);

  const { 
    data: units = [], 
    isLoading, 
    error 
  } = useQuery(
    ['units', 'search', searchParams],
    () => searchUnits(searchParams),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  );

  const handleUnitClick = useCallback((unit: NavalUnit) => {
    // Navigate to unit detail/edit page
    navigate(`/units/${unit.id}`);
  }, [navigate]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading units: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchInput 
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search units by name, class, or nation..."
        className="w-full"
      />
      
      <UnitsListVirtualized 
        units={units}
        onUnitClick={handleUnitClick}
        isLoading={isLoading}
      />
    </div>
  );
};

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**MEMOIZATION STRATEGICA**
```typescript
import { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { isEqual } from 'lodash-es';

// Deep comparison memo
const deepMemo = <T extends Record<string, any>>(Component: React.ComponentType<T>) => {
  return memo(Component, (prevProps, nextProps) => {
    return isEqual(prevProps, nextProps);
  });
};

// Optimized canvas element with comprehensive memoization
interface CanvasElementProps {
  element: CanvasElementType;
  isSelected: boolean;
  isHovered: boolean;
  onUpdate: (elementId: string, updates: Partial<CanvasElementType>) => void;
  onSelect: (elementId: string) => void;
  onHover: (elementId: string | null) => void;
  scale: number;
  readonly?: boolean;
}

const CanvasElement = memo<CanvasElementProps>(({
  element,
  isSelected,
  isHovered,
  onUpdate,
  onSelect,
  onHover,
  scale,
  readonly = false
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Memoize computed styles
  const elementStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: element.x * scale,
    top: element.y * scale,
    width: element.width * scale,
    height: element.height * scale,
    transform: `rotate(${element.rotation || 0}deg)`,
    zIndex: element.zIndex || 1,
    ...element.style,
    // Scale-dependent styles
    fontSize: element.style?.fontSize ? `${element.style.fontSize * scale}px` : undefined,
    borderWidth: element.style?.borderWidth ? `${element.style.borderWidth * scale}px` : undefined,
  }), [element, scale]);

  // Memoize selection styles
  const selectionStyle = useMemo(() => {
    if (!isSelected && !isHovered) return {};
    
    return {
      outline: isSelected ? '2px solid #3b82f6' : '1px solid #93c5fd',
      outlineOffset: '-1px'
    };
  }, [isSelected, isHovered]);

  // Stable event handlers
  const handleUpdate = useCallback((updates: Partial<CanvasElementType>) => {
    onUpdate(element.id, updates);
  }, [element.id, onUpdate]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readonly) {
      onSelect(element.id);
    }
  }, [element.id, onSelect, readonly]);

  const handleMouseEnter = useCallback(() => {
    if (!readonly) {
      onHover(element.id);
    }
  }, [element.id, onHover, readonly]);

  const handleMouseLeave = useCallback(() => {
    if (!readonly) {
      onHover(null);
    }
  }, [onHover, readonly]);

  // Memoize content rendering
  const elementContent = useMemo(() => {
    switch (element.type) {
      case 'text':
      case 'unit_name':
      case 'unit_class':
        return (
          <div
            className="w-full h-full flex items-center justify-start px-2 overflow-hidden"
            style={{
              fontSize: element.style?.fontSize ? `${element.style.fontSize * scale}px` : undefined,
              fontWeight: element.style?.fontWeight,
              color: element.style?.color,
              textAlign: element.style?.textAlign as any,
              whiteSpace: element.style?.whiteSpace as any,
            }}
          >
            <div style={{ whiteSpace: 'pre-line' }}>
              {element.content || `[${element.type.toUpperCase()}]`}
            </div>
          </div>
        );

      case 'logo':
      case 'silhouette':
      case 'flag':
        return (
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            {element.image ? (
              <img
                src={getImageUrl(element.image)}
                alt={element.type}
                className="max-w-full max-h-full object-contain"
                style={{ display: 'block' }}
                loading="lazy"
                onError={(e) => {
                  console.error('Error loading image:', element.image);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="text-gray-400 text-center text-xs font-medium select-none">
                {element.type.toUpperCase()}
              </div>
            )}
          </div>
        );

      case 'table':
        return (
          <div className="w-full h-full bg-white border border-gray-300 overflow-auto">
            <div className="p-2">
              <div className="text-xs font-bold mb-2">CHARACTERISTICS</div>
              <div className="text-xs">
                {element.tableData?.map((row: string[], rowIndex: number) => (
                  <div key={rowIndex} className="flex border-b border-gray-200 last:border-b-0">
                    {row.map((cell: string, colIndex: number) => {
                      const isHeader = rowIndex === 0;
                      const bgColor = colIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white';
                      
                      return (
                        <div
                          key={colIndex}
                          className={`flex-1 p-1 border-r border-gray-200 last:border-r-0 ${bgColor} ${
                            isHeader ? 'font-medium' : ''
                          }`}
                          style={{ fontSize: `${10 * scale}px` }}
                        >
                          <span>{cell}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Unknown element type: {element.type}
          </div>
        );
    }
  }, [element, scale]);

  return (
    <div
      ref={elementRef}
      className={`canvas-element ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
      style={{ ...elementStyle, ...selectionStyle }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-element-id={element.id}
      data-element-type={element.type}
    >
      {elementContent}
      
      {/* Selection handles */}
      {isSelected && !readonly && (
        <SelectionHandles
          element={element}
          scale={scale}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.element.id === nextProps.element.id &&
    prevProps.element.x === nextProps.element.x &&
    prevProps.element.y === nextProps.element.y &&
    prevProps.element.width === nextProps.element.width &&
    prevProps.element.height === nextProps.element.height &&
    prevProps.element.rotation === nextProps.element.rotation &&
    prevProps.element.content === nextProps.element.content &&
    prevProps.element.image === nextProps.element.image &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.scale === nextProps.scale &&
    prevProps.readonly === nextProps.readonly &&
    isEqual(prevProps.element.style, nextProps.element.style) &&
    isEqual(prevProps.element.tableData, nextProps.element.tableData)
  );
});

// Optimized canvas editor with performance considerations
const CanvasEditor: React.FC<{ 
  unitId: string;
  readonly?: boolean;
}> = memo(({ unitId, readonly = false }) => {
  const [elements, setElements] = useState<CanvasElementType[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
    width: 1123,
    height: 794,
    background: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000'
  });

  // Performance tracking
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    console.log(`CanvasEditor render #${renderCount.current}`);
  });

  // Stable callback functions
  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElementType>) => {
    setElements(prevElements => 
      prevElements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    );
  }, []);

  const selectElement = useCallback((elementId: string) => {
    setSelectedElementId(elementId);
  }, []);

  const hoverElement = useCallback((elementId: string | null) => {
    setHoveredElementId(elementId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElementId(null);
  }, []);

  // Memoize canvas style
  const canvasStyle = useMemo(() => ({
    width: canvasConfig.width * scale,
    height: canvasConfig.height * scale,
    backgroundColor: canvasConfig.background,
    borderWidth: canvasConfig.borderWidth * scale,
    borderColor: canvasConfig.borderColor,
    borderStyle: 'solid' as const,
    position: 'relative' as const,
    overflow: 'visible' as const,
    transformOrigin: 'top left' as const,
  }), [canvasConfig, scale]);

  // Memoize elements with current selection/hover state
  const elementsWithState = useMemo(() => 
    elements.map(element => ({
      element,
      isSelected: element.id === selectedElementId,
      isHovered: element.id === hoveredElementId,
    }))
  , [elements, selectedElementId, hoveredElementId]);

  return (
    <div className="canvas-editor-container">
      {/* Toolbar */}
      {!readonly && (
        <div className="canvas-toolbar mb-4 p-2 bg-gray-100 rounded">
          <button
            onClick={() => setScale(s => Math.min(s + 0.1, 2))}
            className="px-3 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
          >
            Zoom In
          </button>
          <button
            onClick={() => setScale(s => Math.max(s - 0.1, 0.1))}
            className="px-3 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
          >
            Zoom Out
          </button>
          <span className="text-sm text-gray-600">
            Scale: {Math.round(scale * 100)}%
          </span>
        </div>
      )}

      {/* Canvas */}
      <div 
        className="canvas-container overflow-auto border-2 border-gray-300"
        style={{ maxHeight: '80vh' }}
      >
        <div
          className="canvas"
          style={canvasStyle}
          onClick={clearSelection}
          onContextMenu={(e) => e.preventDefault()}
        >
          {elementsWithState.map(({ element, isSelected, isHovered }) => (
            <CanvasElement
              key={element.id}
              element={element}
              isSelected={isSelected}
              isHovered={isHovered}
              onUpdate={updateElement}
              onSelect={selectElement}
              onHover={hoverElement}
              scale={scale}
              readonly={readonly}
            />
          ))}
        </div>
      </div>

      {/* Element properties panel */}
      {selectedElementId && !readonly && (
        <ElementPropertiesPanel
          element={elements.find(el => el.id === selectedElementId)!}
          onUpdate={updateElement}
        />
      )}
    </div>
  );
});

// Display name for debugging
CanvasEditor.displayName = 'CanvasEditor';
CanvasElement.displayName = 'CanvasElement';
```

## PRIORITÀ DI IMPLEMENTAZIONE

### FASE 1 - CRITICA (Implementare SUBITO):
1. ✅ **Sicurezza SECRET_KEY** - Sostituire hardcoded secret
2. ✅ **Password Hashing** - Implementare bcrypt
3. ✅ **Rate Limiting** - Aggiungere limitazioni per API critiche
4. ✅ **Input Sanitization** - Validazione e sanitizzazione completa
5. ✅ **File Upload Security** - Validazione file con magic numbers

### FASE 2 - ALTA PRIORITÀ (1-2 settimane):
1. ✅ **Logging Strutturato** - Sistema logging completo
2. ✅ **Exception Handling** - Gestione errori specifica
3. ✅ **Database Indexing** - Aggiungere indici critici
4. ✅ **Caching System** - Implementare Redis caching
5. ✅ **Performance Optimization** - Query ottimizzate

### FASE 3 - MEDIA PRIORITÀ (1 mese):
1. **Testing Framework** - Test suite completa
2. **Monitoring System** - Metriche e alerting
3. **Frontend Optimization** - Code splitting e memoization
4. **API Documentation** - Documentazione OpenAPI completa
5. **Environment Configuration** - Configurazione per ambienti diversi

### FASE 4 - BASSA PRIORITÀ (2-3 mesi):
1. **Advanced Analytics** - Metriche business avanzate
2. **Backup System** - Backup automatici
3. **Load Testing** - Test di carico
4. **Performance Monitoring** - APM integration
5. **Security Audit** - Audit sicurezza completo

Ogni implementazione deve essere accompagnata da:
- ✅ Test unitari e integrazione
- ✅ Documentazione aggiornata
- ✅ Migration scripts per database
- ✅ Rollback plan
- ✅ Performance benchmarks