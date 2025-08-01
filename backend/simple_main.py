from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import os
import shutil
from uuid import uuid4
import jwt
from datetime import datetime, timedelta
import datetime as dt
import hashlib
import tempfile
import io

from app.simple_database import SimpleDatabase, init_database, get_db_connection
from utils.powerpoint_export import create_group_powerpoint, create_unit_powerpoint, create_unit_powerpoint_to_buffer
from api.quiz import router as quiz_router
import threading
import time

app = FastAPI(
    title="Naval Units Management System",
    description="API for managing naval unit information sheets",
    version="1.0.0"
)

# Include routers
from api.portfolio import router as portfolio_router
app.include_router(quiz_router, prefix="/api", tags=["quiz"])
app.include_router(portfolio_router, prefix="/api", tags=["portfolio"])

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    #allow_origins=[
    #    "http://localhost:5173"
    #],
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Custom middleware to add CORS headers to static files
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class StaticFilesCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add CORS headers for static files (images)
        if request.url.path.startswith("/api/static/"):
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
        
        return response

app.add_middleware(StaticFilesCORSMiddleware)

# Create data and uploads directories if they don't exist
os.makedirs("./data", exist_ok=True)
UPLOAD_DIR = "./data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Static files for uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Additional static file routes for direct access (for compatibility)
app.mount("/silhouettes", StaticFiles(directory=os.path.join(UPLOAD_DIR, "silhouettes")), name="silhouettes")
app.mount("/logos", StaticFiles(directory=os.path.join(UPLOAD_DIR, "logos")), name="logos")
app.mount("/flags", StaticFiles(directory=os.path.join(UPLOAD_DIR, "flags")), name="flags")

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Pydantic models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class Token(BaseModel):
    access_token: str
    token_type: str

class NavalUnitCreate(BaseModel):
    name: str
    unit_class: str
    nation: Optional[str] = None
    background_color: str = "#ffffff"
    layout_config: Optional[Dict[str, Any]] = None
    current_template_id: Optional[str] = None
    logo_path: Optional[str] = None
    flag_path: Optional[str] = None
    silhouette_path: Optional[str] = None
    characteristics: List[Dict[str, Any]] = []

class CharacteristicCreate(BaseModel):
    characteristic_name: str
    characteristic_value: str
    order_index: int = 0

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    naval_unit_ids: List[int] = []

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    naval_unit_ids: Optional[List[int]] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class AdminPasswordChange(BaseModel):
    new_password: str

# Auth functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(dt.timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = SimpleDatabase.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        if not user["is_active"]:
            raise HTTPException(status_code=401, detail="User not active")
        
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_admin_user(user: dict = Depends(get_current_user)):
    if not user["is_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# File upload helper
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".svg"}

def save_uploaded_file(file: UploadFile, subfolder: str) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    unique_filename = f"{uuid4()}{file_extension}"
    full_file_path = os.path.join(UPLOAD_DIR, subfolder, unique_filename)
    
    os.makedirs(os.path.dirname(full_file_path), exist_ok=True)
    
    with open(full_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return relative path for database storage (subfolder/filename) with forward slashes
    return f"{subfolder}/{unique_filename}"

# Routes
@app.get("/")
async def root():
    return {"message": "Naval Units Management System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/upload-image")
async def upload_image(image: UploadFile = File(...), subfolder: str = Form("general")):
    """Upload an image file and return the file path"""
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Use the same save function to maintain consistency
        file_path = save_uploaded_file(image, subfolder)
        
        # Return relative path for database storage
        return {"file_path": file_path}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

# Auth routes
@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    user_id = SimpleDatabase.create_user(
        user_data.email, 
        user_data.first_name, 
        user_data.last_name, 
        user_data.password
    )
    if not user_id:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return {"message": "User registered successfully", "id": user_id}

@app.post("/api/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    print(f"🔍 Login attempt for email: {user_credentials.email}")
    user = SimpleDatabase.get_user_by_email(user_credentials.email)
    print(f"🔍 User found: {user is not None}")
    
    if not user:
        print("🔍 User not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    print(f"🔍 User active: {user.get('is_active')}")
    password_valid = SimpleDatabase.verify_password(user_credentials.password, user["hashed_password"])
    print(f"🔍 Password valid: {password_valid}")
    
    if not password_valid:
        print("🔍 Invalid password")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user["is_active"]:
        print("🔍 Account not activated")
        raise HTTPException(status_code=401, detail="Account not activated")
    
    access_token = create_access_token(data={"sub": user["email"]})
    print("🔍 Login successful")
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "is_active": user["is_active"],
        "is_admin": user["is_admin"],
        "created_at": user["created_at"]
    }

# Naval units routes
@app.get("/api/units")
async def get_naval_units(skip: int = 0, limit: int = 100, user: dict = Depends(get_current_user)):
    units = SimpleDatabase.get_naval_units(skip, limit)
    return units

@app.get("/api/units/{unit_id}")
async def get_naval_unit(unit_id: int, user: dict = Depends(get_current_user)):
    unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    return unit

# Public endpoint for viewing units (no authentication required)
@app.get("/api/public/units/{unit_id}")
async def get_naval_unit_public(unit_id: int):
    """Get naval unit for public viewing (no authentication required)"""
    unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    return unit

@app.post("/api/units")
async def create_naval_unit(unit: NavalUnitCreate, user: dict = Depends(get_current_user)):
    unit_id = SimpleDatabase.create_naval_unit(
        name=unit.name,
        unit_class=unit.unit_class,
        nation=unit.nation,
        background_color=unit.background_color,
        layout_config=unit.layout_config,
        current_template_id=unit.current_template_id,
        logo_path=unit.logo_path,
        flag_path=unit.flag_path,
        silhouette_path=unit.silhouette_path,
        created_by=user["id"]
    )
    
    if not unit_id:
        raise HTTPException(status_code=400, detail="Unit with this name and class already exists")
    
    # Add characteristics
    for char in unit.characteristics:
        SimpleDatabase.add_characteristic(
            unit_id, 
            char["characteristic_name"], 
            char["characteristic_value"], 
            char.get("order_index", 0)
        )
    
    return {"message": "Naval unit created", "id": unit_id}

@app.get("/api/units/search/")
async def search_units(q: str, search_type: str = "all", user: dict = Depends(get_current_user)):
    units = SimpleDatabase.search_naval_units(q, search_type)
    return {"naval_units": units, "total_count": len(units)}

# File upload routes
@app.put("/api/units/{unit_id}")
async def update_naval_unit(unit_id: int, unit: dict, user: dict = Depends(get_current_user)):
    print(f"🔍 Updating unit {unit_id} with data: {unit}")
    success = SimpleDatabase.update_naval_unit(unit_id, **unit)
    print(f"🔍 Update success: {success}")
    if not success:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    return {"message": "Naval unit updated successfully"}

@app.delete("/api/units/{unit_id}")
async def delete_naval_unit(unit_id: int, user: dict = Depends(get_current_user)):
    if SimpleDatabase.delete_naval_unit(unit_id):
        return {"message": "Naval unit deleted successfully"}
    raise HTTPException(status_code=404, detail="Naval unit not found")

@app.post("/api/units/{unit_id}/upload-logo")
async def upload_logo(unit_id: int, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    file_path = save_uploaded_file(file, "logos")
    SimpleDatabase.update_naval_unit_logo(unit_id, file_path)
    return {"message": "Logo uploaded successfully", "file_path": file_path}

@app.post("/api/units/{unit_id}/upload-silhouette")
async def upload_silhouette(unit_id: int, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    file_path = save_uploaded_file(file, "silhouettes")
    SimpleDatabase.update_naval_unit_silhouette(unit_id, file_path)
    return {"message": "Silhouette uploaded successfully", "file_path": file_path}

@app.post("/api/units/{unit_id}/upload-flag")
async def upload_flag(unit_id: int, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    file_path = save_uploaded_file(file, "flags")
    SimpleDatabase.update_naval_unit_flag(unit_id, file_path)
    return {"message": "Flag uploaded successfully", "file_path": file_path}

@app.post("/api/units/{unit_id}/export/powerpoint")
async def export_unit_powerpoint(unit_id: int, export_data: dict = None):
    """Export a single naval unit to PowerPoint presentation (authenticated)"""
    template_config = export_data.get('template_config') if export_data else None
    element_states = export_data.get('element_states') if export_data else None
    return await _export_unit_powerpoint_internal(unit_id, template_config, element_states)

@app.post("/api/public/units/{unit_id}/export/powerpoint")
async def export_unit_powerpoint_public(unit_id: int, export_data: dict = None):
    """Export a single naval unit to PowerPoint presentation (public, no auth required)"""
    template_config = export_data.get('template_config') if export_data else None
    element_states = export_data.get('element_states') if export_data else None
    return await _export_unit_powerpoint_internal(unit_id, template_config, element_states)

async def _export_unit_powerpoint_internal(unit_id: int, template_config: dict = None, element_states: dict = None):
    """Export a single naval unit to PowerPoint presentation"""
    
    try:
        print(f"Single unit PowerPoint export requested for unit ID: {unit_id}")
        
        # Get the unit with all related data
        unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
        if not unit:
            print(f"Unit {unit_id} not found")
            raise HTTPException(status_code=404, detail="Naval unit not found")
        
        print(f"Unit found: {unit['name']}")
        
        # Create PowerPoint in memory
        from io import BytesIO
        output_buffer = BytesIO()
        
        print(f"Creating PowerPoint in memory")
        print(f"Template config: {template_config}")
        
        # Generate PowerPoint presentation using single unit function
        create_unit_powerpoint_to_buffer(unit, output_buffer, template_config)
        print(f"PowerPoint created successfully in memory")
        
        # Create final filename
        safe_name = "".join(c for c in unit['name'] if c.isalnum() or c in (' ', '-', '_')).rstrip()
        if not safe_name:  # Fallback if name becomes empty
            safe_name = f"unit_{unit_id}"
        final_filename = f"{safe_name}_scheda.pptx"
        
        # Return in-memory file as response
        output_buffer.seek(0)
        from fastapi.responses import StreamingResponse
        
        return StreamingResponse(
            io.BytesIO(output_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": f"attachment; filename={final_filename}"}
        )
        
    except Exception as e:
        print(f"Single unit PowerPoint export error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # No temp file cleanup needed for in-memory processing
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating PowerPoint presentation: {str(e)}"
        )

@app.get("/api/units/{unit_id}/export/pdf")
async def export_unit_pdf(unit_id: int, group_id: Optional[int] = None, user: dict = Depends(get_current_user)):
    # TODO: Implement PDF export
    raise HTTPException(status_code=501, detail="PDF export not implemented")

@app.post("/api/units/{unit_id}/export/png")
async def export_unit_png(unit_id: int, export_data: dict = None):
    """Export a single naval unit to PNG image (server-side rendering)"""
    layout_config = export_data.get('layout_config') if export_data else None
    return await _export_unit_png_internal(unit_id, layout_config)

@app.post("/api/public/units/{unit_id}/export/png")
async def export_unit_png_public(unit_id: int, export_data: dict = None):
    """Export a single naval unit to PNG image (public, no auth required)"""
    if export_data:
        # Portfolio approach: template_id + customizations
        if 'template_id' in export_data and 'customizations' in export_data:
            print(f"🎯 Portfolio PNG export - template_id: {export_data.get('template_id')}")
            return await _export_portfolio_png_internal(unit_id, export_data['template_id'], export_data['customizations'])
        # Regular approach: layout_config
        elif 'layout_config' in export_data:
            print(f"📄 Regular PNG export with custom layout_config")
            return await _export_unit_png_internal(unit_id, export_data['layout_config'])
    
    # Default: use unit's original layout_config
    print(f"📄 Regular PNG export with unit's original layout_config")
    return await _export_unit_png_internal(unit_id, None)

async def _export_portfolio_png_internal(unit_id: int, template_id: str, customizations: dict):
    """Export a portfolio unit to PNG using template + customizations approach"""
    try:
        print(f"🎯 Portfolio PNG export - unit: {unit_id}, template: {template_id}")
        
        # Get the unit
        unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
        if not unit:
            raise HTTPException(status_code=404, detail="Naval unit not found")
        
        # Get the template  
        template = SimpleDatabase.get_template_by_id_public(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        print(f"📋 Template found: {template['name']}")
        print(f"🎨 Customizations: element_states={len(customizations.get('element_states', {}))}, canvas_config={bool(customizations.get('canvas_config'))}")
        
        # Build layout config using template + customizations (same logic as PowerPoint)
        layout_config = template['config'].copy() if template['config'] else {}
        
        # Apply canvas customizations
        if customizations.get('canvas_config'):
            layout_config.update(customizations['canvas_config'])
        
        # Apply element state customizations
        if customizations.get('element_states') and layout_config.get('elements'):
            for element in layout_config['elements']:
                element_state = customizations['element_states'].get(element['id'])
                if element_state:
                    element.update(element_state)
        
        # Override unit's layout_config with the built one
        unit['layout_config'] = layout_config
        
        print(f"✅ Built layout config with {len(layout_config.get('elements', []))} elements")
        
        # Use standard PNG creation
        from utils.png_export import create_unit_png_to_buffer
        output_buffer = io.BytesIO()
        create_unit_png_to_buffer(unit, output_buffer)
        
        # Return as response
        output_buffer.seek(0)
        from fastapi.responses import StreamingResponse
        safe_name = "".join(c for c in unit['name'] if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"{safe_name}_{template['name']}.png"
        
        return StreamingResponse(
            io.BytesIO(output_buffer.read()),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        print(f"❌ Portfolio PNG export error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Portfolio PNG export failed: {str(e)}")

async def _export_unit_png_internal(unit_id: int, custom_layout_config: dict = None):
    """Export a single naval unit to PNG image"""
    
    try:
        print(f"PNG export requested for unit ID: {unit_id}")
        
        # Get the unit with all related data
        unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
        if not unit:
            print(f"Unit {unit_id} not found")
            raise HTTPException(status_code=404, detail="Naval unit not found")
        
        print(f"Unit found: {unit['name']}")
        
        # Override layout_config if custom one provided
        if custom_layout_config:
            print(f"Using custom layout config with {len(custom_layout_config.get('elements', []))} elements")
            unit['layout_config'] = custom_layout_config
        else:
            print(f"Using unit's original layout config")
        
        # Create PNG using server-side rendering in memory
        from utils.png_export import create_unit_png_to_buffer
        
        # Create PNG in memory
        output_buffer = io.BytesIO()
        
        print(f"Creating PNG in memory")
        
        # Generate PNG image
        create_unit_png_to_buffer(unit, output_buffer)
        print(f"PNG created successfully in memory")
        
        # Create final filename
        safe_name = "".join(c for c in unit['name'] if c.isalnum() or c in (' ', '-', '_')).rstrip()
        if not safe_name:
            safe_name = f"unit_{unit_id}"
        final_filename = f"{safe_name}_scheda.png"
        
        # Return in-memory file as response
        output_buffer.seek(0)
        from fastapi.responses import StreamingResponse
        
        return StreamingResponse(
            io.BytesIO(output_buffer.read()),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename={final_filename}"}
        )
        
    except Exception as e:
        print(f"PNG export error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # No temp file cleanup needed for in-memory processing
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating PNG image: {str(e)}"
        )

@app.get("/api/groups/{group_id}/presentation/slide/{unit_id}")
async def get_presentation_slide(group_id: int, unit_id: int):
    """Get a presentation slide as PNG image"""
    
    try:
        print(f"Presentation slide requested for group {group_id}, unit {unit_id}")
        
        # Get the group and unit
        group = SimpleDatabase.get_group_by_id(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Find the unit in the group
        unit = None
        for naval_unit in group.get('naval_units', []):
            if naval_unit['id'] == unit_id:
                unit = naval_unit
                break
        
        if not unit:
            raise HTTPException(status_code=404, detail="Unit not found in group")
        
        print(f"Found unit: {unit['name']}")
        
        # Create PNG in memory using the same logic as PNG export
        from utils.png_export import create_unit_png_to_buffer
        
        output_buffer = io.BytesIO()
        
        print(f"Creating presentation slide in memory")
        
        # Generate PNG image
        create_unit_png_to_buffer(unit, output_buffer)
        print(f"Presentation slide created successfully")
        
        # Return as image response
        output_buffer.seek(0)
        from fastapi.responses import StreamingResponse
        
        return StreamingResponse(
            io.BytesIO(output_buffer.read()),
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=300"}  # Cache for 5 minutes
        )
        
    except Exception as e:
        print(f"Presentation slide error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating presentation slide: {str(e)}"
        )

# Admin routes
@app.get("/api/admin/users")
async def get_all_users(skip: int = 0, limit: int = 100, admin: dict = Depends(get_admin_user)):
    users = SimpleDatabase.get_all_users(skip, limit)
    return users

@app.get("/api/admin/users/pending")
async def get_pending_users(admin: dict = Depends(get_admin_user)):
    users = SimpleDatabase.get_pending_users()
    return users

@app.post("/api/admin/users/{user_id}/activate")
async def activate_user(user_id: int, admin: dict = Depends(get_admin_user)):
    if SimpleDatabase.activate_user(user_id):
        return {"message": "User activated successfully"}
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/api/admin/users/{user_id}/deactivate")
async def deactivate_user(user_id: int, admin: dict = Depends(get_admin_user)):
    if SimpleDatabase.deactivate_user(user_id):
        return {"message": "User deactivated successfully"}
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/api/admin/users/{user_id}/make-admin")
async def make_admin(user_id: int, admin: dict = Depends(get_admin_user)):
    if SimpleDatabase.make_admin(user_id):
        return {"message": "User promoted to admin successfully"}
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/api/admin/users/{user_id}/remove-admin")
async def remove_admin(user_id: int, admin: dict = Depends(get_admin_user)):
    if SimpleDatabase.remove_admin(user_id):
        return {"message": "Admin privileges removed successfully"}
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/api/auth/change-password")
async def change_password(password_data: PasswordChange, user: dict = Depends(get_current_user)):
    """Allow users to change their own password"""
    # Verify current password
    if not SimpleDatabase.verify_password(password_data.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    if SimpleDatabase.update_user_password(user["id"], password_data.new_password):
        return {"message": "Password changed successfully"}
    raise HTTPException(status_code=500, detail="Error updating password")

@app.post("/api/admin/users/{user_id}/change-password")
async def admin_change_user_password(user_id: int, password_data: AdminPasswordChange, admin: dict = Depends(get_admin_user)):
    """Allow admin to change any user's password"""
    if SimpleDatabase.update_user_password(user_id, password_data.new_password):
        return {"message": "Password changed successfully"}
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/api/admin/change-own-password")
async def admin_change_own_password(password_data: PasswordChange, admin: dict = Depends(get_admin_user)):
    """Allow admin to change their own password"""
    # Verify current password
    if not SimpleDatabase.verify_password(password_data.current_password, admin["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    if SimpleDatabase.update_user_password(admin["id"], password_data.new_password):
        return {"message": "Admin password changed successfully"}
    raise HTTPException(status_code=500, detail="Error updating password")

# Groups routes
@app.get("/api/groups")
async def get_groups(skip: int = 0, limit: int = 100, user: dict = Depends(get_current_user)):
    groups = SimpleDatabase.get_groups(skip, limit)
    return groups

@app.get("/api/groups/{group_id}")
async def get_group(group_id: int, user: dict = Depends(get_current_user)):
    group = SimpleDatabase.get_group_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return group

@app.post("/api/groups")
async def create_group(group: GroupCreate, user: dict = Depends(get_current_user)):
    group_id = SimpleDatabase.create_group(
        name=group.name,
        description=group.description,
        created_by=user["id"],
        naval_unit_ids=group.naval_unit_ids
    )
    if not group_id:
        raise HTTPException(status_code=400, detail="Error creating group")
    
    return {"message": "Group created successfully", "id": group_id}


@app.put("/api/groups/{group_id}")
async def update_group(group_id: int, group_update: GroupUpdate, user: dict = Depends(get_current_user)):
    success = SimpleDatabase.update_group(
        group_id=group_id,
        name=group_update.name,
        description=group_update.description,
        naval_unit_ids=group_update.naval_unit_ids
    )
    if not success:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"message": "Group updated successfully"}

@app.delete("/api/groups/{group_id}")
async def delete_group(group_id: int, user: dict = Depends(get_current_user)):
    if SimpleDatabase.delete_group(group_id):
        return {"message": "Group deleted successfully"}
    raise HTTPException(status_code=404, detail="Group not found")

@app.post("/api/groups/{group_id}/upload-logo")
async def upload_group_logo(group_id: int, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    group = SimpleDatabase.get_group_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    file_path = save_uploaded_file(file, "groups")
    SimpleDatabase.update_group_logo(group_id, file_path)
    return {"message": "Group logo uploaded successfully", "file_path": file_path}

@app.post("/api/groups/{group_id}/upload-flag")
async def upload_group_flag(group_id: int, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    group = SimpleDatabase.get_group_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    file_path = save_uploaded_file(file, "groups")
    SimpleDatabase.update_group_flag(group_id, file_path)
    return {"message": "Group flag uploaded successfully", "file_path": file_path}

@app.get("/api/groups/{group_id}/export/powerpoint")
async def export_group_powerpoint(group_id: int, user: dict = Depends(get_current_user)):
    """Export a group's naval units to PowerPoint presentation"""
    
    try:
        print(f"PowerPoint export requested for group ID: {group_id}")
        
        # Get the group with all related data
        group = SimpleDatabase.get_group_by_id(group_id)
        if not group:
            print(f"Group {group_id} not found")
            raise HTTPException(status_code=404, detail="Group not found")
        
        print(f"Group found: {group['name']} with {len(group.get('naval_units', []))} units")
        
        # Prepare group data for PowerPoint export
        group_data = {
            'id': group['id'],
            'name': group['name'],
            'description': group['description'],
            'naval_units': group['naval_units'],
            'presentation_config': {
                'mode': 'single',
                'interval': 5,
                'grid_rows': 3,
                'grid_cols': 3,
                'auto_advance': True,
                'page_duration': 10
            },
            'override_logo': False,
            'override_flag': False,
            'template_logo_path': None,
            'template_flag_path': None
        }
        
        print(f"Group data prepared for export")
        
        # Create temporary file for PowerPoint in server directory
        temp_dir = "./data/temp"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        temp_filename = f"ppt_{uuid.uuid4().hex}.pptx"
        output_path = os.path.join(temp_dir, temp_filename)
        
        print(f"Temporary file created: {output_path}")
        
        # Generate PowerPoint presentation
        created_path = create_group_powerpoint(group_data, output_path)
        print(f"PowerPoint created successfully: {created_path}")
        
        # Create exports directory if it doesn't exist
        exports_dir = "./data/exports"
        os.makedirs(exports_dir, exist_ok=True)
        print(f"Exports directory ensured: {exports_dir}")
        
        # Create final filename with better handling
        safe_name = "".join(c for c in group['name'] if c.isalnum() or c in (' ', '-', '_')).rstrip()
        if not safe_name:  # Fallback if name becomes empty
            safe_name = f"group_{group_id}"
        final_filename = f"{safe_name}_presentation.pptx"
        final_path = os.path.join(exports_dir, final_filename)
        
        print(f"Final path: {final_path}")
        
        # Move file to exports directory
        shutil.move(created_path, final_path)
        print(f"File moved to final location")
        
        # Return file response
        return FileResponse(
            path=final_path,
            filename=final_filename,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
        
    except Exception as e:
        print(f"PowerPoint export error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Clean up temp file on error
        if 'output_path' in locals() and os.path.exists(output_path):
            os.unlink(output_path)
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating PowerPoint presentation: {str(e)}"
        )

# Template state endpoints
@app.post("/api/units/{unit_id}/template-states/{template_id}")
async def save_template_state(unit_id: int, template_id: str, state_data: dict, user: dict = Depends(get_current_user)):
    """Save the state of elements for a specific template - for internal state management only"""
    try:
        element_states = state_data.get('element_states', {})
        canvas_config = state_data.get('canvas_config', {})
        
        # Save to template states for this unit (NOT to portfolio)
        success = SimpleDatabase.save_unit_template_state(
            unit_id=unit_id,
            template_id=template_id,
            element_states=element_states,
            canvas_config=canvas_config
        )
        
        if success:
            return {
                "message": "Template state saved successfully", 
                "template_id": template_id
            }
        else:
            raise HTTPException(status_code=500, detail="Error saving template state")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/units/{unit_id}/template-states/{template_id}")
async def get_template_state(unit_id: int, template_id: str, user: dict = Depends(get_current_user)):
    """Get the saved state for a specific template - checks user's portfolio first"""
    # Prima controlla se l'utente ha questa combinazione nel portfolio
    portfolio_state = SimpleDatabase.get_user_portfolio_unit_state(user['id'], unit_id, template_id)
    if portfolio_state:
        return {
            "element_states": portfolio_state.get('element_states', {}),
            "canvas_config": portfolio_state.get('canvas_config', {}),
            "custom_name": portfolio_state.get('custom_name'),
            "notes": portfolio_state.get('notes', ''),
            "from_portfolio": True
        }
    
    # Se non c'è nel portfolio, ritorna stato vuoto (non più dall'originale)
    return {"element_states": {}, "canvas_config": {}, "from_portfolio": False}

@app.get("/api/units/{unit_id}/template-states")
async def get_all_template_states(unit_id: int, user: dict = Depends(get_current_user)):
    """Get all template states for a unit"""
    states = SimpleDatabase.get_all_template_states_for_unit(unit_id)
    return {"template_states": states}

# Template Management Endpoints
@app.post("/api/templates")
async def create_template(template_data: dict, user: dict = Depends(get_current_user)):
    """Create a new template"""
    try:
        template_id = SimpleDatabase.save_template(template_data, user['id'])
        return {"message": "Template created successfully", "template_id": template_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating template: {str(e)}")

@app.get("/api/templates")
async def get_templates(user: dict = Depends(get_current_user)):
    """Get all templates for the current user"""
    try:
        templates = SimpleDatabase.get_templates(user['id'])
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching templates: {str(e)}")

@app.get("/api/templates/{template_id}")
async def get_template(template_id: str, user: dict = Depends(get_current_user)):
    """Get a specific template"""
    try:
        template = SimpleDatabase.get_template(template_id, user['id'])
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching template: {str(e)}")

@app.put("/api/templates/{template_id}")
async def update_template(template_id: str, template_data: dict, user: dict = Depends(get_current_user)):
    """Update a template - NON modifica più le unità originali automaticamente"""
    try:
        # Update only the template
        success = SimpleDatabase.update_template(template_id, template_data, user['id'])
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"message": "Template updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating template: {str(e)}")

# Nuovo endpoint per applicare template a una o più unità
@app.post("/api/templates/{template_id}/apply")
async def apply_template_to_units(
    template_id: str, 
    unit_ids: dict,  # {"unit_ids": [1, 2, 3]}
    user: dict = Depends(get_current_user)
):
    """Applica template a una o più unità - le aggiunge al portfolio utente"""
    print(f"🔍 APPLY TEMPLATE ENDPOINT CALLED:")
    print(f"  Template ID: {template_id}")
    print(f"  Unit IDs: {unit_ids.get('unit_ids', [])}")
    print(f"  User: {user['id']}")
    try:
        template = SimpleDatabase.get_template(template_id, user['id'])
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        applied_units = []
        for unit_id in unit_ids.get('unit_ids', []):
            # Verifica che l'unità esista
            unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
            if not unit:
                continue
                
            # Convert template elements array to element_states object and apply unit data
            template_elements = template.get('elements', [])
            element_states = {}
            
            for element in template_elements:
                element_data = element.copy()
                
                # Apply unit data to replace placeholders
                if element.get('type') == 'unit_name':
                    element_data['content'] = unit.get('name', element.get('content', '[NOME UNITÀ]'))
                elif element.get('type') == 'unit_class':
                    element_data['content'] = unit.get('unit_class', element.get('content', '[CLASSE]'))
                elif element.get('type') == 'logo' and unit.get('logo_path'):
                    element_data['image'] = unit['logo_path']
                elif element.get('type') == 'flag' and unit.get('flag_path'):
                    element_data['image'] = unit['flag_path']
                elif element.get('type') == 'silhouette' and unit.get('silhouette_path'):
                    element_data['image'] = unit['silhouette_path']
                
                element_states[element['id']] = element_data
            
            # Aggiungi al portfolio utente con dati corretti
            portfolio_unit_id = SimpleDatabase.add_unit_to_user_portfolio(
                user_id=user['id'],
                naval_unit_id=unit_id,
                template_id=template_id,
                element_states=element_states,
                canvas_config={
                    'canvasWidth': template.get('canvasWidth', 1123),
                    'canvasHeight': template.get('canvasHeight', 794),
                    'canvasBackground': template.get('canvasBackground', '#ffffff'),
                    'canvasBorderWidth': template.get('canvasBorderWidth', 2),
                    'canvasBorderColor': template.get('canvasBorderColor', '#000000')
                }
            )
            
            if portfolio_unit_id:
                applied_units.append({
                    'unit_id': unit_id,
                    'unit_name': unit['name'],
                    'portfolio_unit_id': portfolio_unit_id
                })
        
        return {
            "message": f"Template applicato a {len(applied_units)} unità nel tuo portfolio",
            "applied_units": applied_units
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying template: {str(e)}")

@app.get("/api/templates/{template_id}/units")
async def get_units_using_template(template_id: str, user: dict = Depends(get_current_user)):
    """Get all units currently using a specific template"""
    try:
        units = SimpleDatabase.get_units_using_template(template_id)
        return {"units": units, "count": len(units)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching units: {str(e)}")

@app.delete("/api/templates/{template_id}")
async def delete_template(template_id: str, user: dict = Depends(get_current_user)):
    """Delete a template"""
    try:
        success = SimpleDatabase.delete_template(template_id, user['id'])
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        return {"message": "Template deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting template: {str(e)}")

@app.post("/api/admin/cleanup-temp-files")
async def manual_cleanup_temp_files(user: dict = Depends(get_current_user)):
    """Manually trigger temp files cleanup (admin only)"""
    if not user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Count files before cleanup
        temp_dir = "./data/temp"
        files_before = len([f for f in os.listdir(temp_dir) if os.path.isfile(os.path.join(temp_dir, f))]) if os.path.exists(temp_dir) else 0
        
        # Run cleanup
        cleanup_temp_files(max_age_hours=2)
        
        # Count files after cleanup
        files_after = len([f for f in os.listdir(temp_dir) if os.path.isfile(os.path.join(temp_dir, f))]) if os.path.exists(temp_dir) else 0
        
        return {
            "message": "Temp files cleanup completed",
            "files_before": files_before,
            "files_after": files_after,
            "files_removed": files_before - files_after
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during cleanup: {str(e)}")

# Function to clean temporary files
def cleanup_temp_files(max_age_hours=2):
    """Clean temporary files older than specified hours (default 2 hours)"""
    temp_dir = "./data/temp"
    if not os.path.exists(temp_dir):
        print(f"Temp directory {temp_dir} does not exist")
        return
    
    try:
        import time
        current_time = time.time()
        max_age_seconds = max_age_hours * 60 * 60
        cutoff_time = current_time - max_age_seconds
        
        total_files = 0
        cleaned_files = 0
        total_size = 0
        
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            if os.path.isfile(file_path):
                total_files += 1
                file_mtime = os.path.getmtime(file_path)
                file_size = os.path.getsize(file_path)
                total_size += file_size
                
                if file_mtime < cutoff_time:
                    os.remove(file_path)
                    cleaned_files += 1
                    print(f"🗑️ Cleaned up temp file: {filename} ({file_size} bytes)")
        
        if cleaned_files > 0:
            print(f"✅ Cleanup completed: {cleaned_files}/{total_files} files removed")
        else:
            print(f"ℹ️ No files to clean. Total: {total_files} files ({total_size/1024:.1f} KB)")
            
    except Exception as e:
        print(f"❌ Error cleaning temp files: {e}")

def start_cleanup_scheduler():
    """Start background thread for periodic cleanup"""
    def cleanup_loop():
        # Initial cleanup at startup
        print("🧹 Running initial temp file cleanup...")
        cleanup_temp_files(max_age_hours=2)
        
        while True:
            # Clean every 2 hours
            time.sleep(2 * 60 * 60)  # Wait 2 hours
            cleanup_temp_files(max_age_hours=2)
    
    cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
    cleanup_thread.start()
    print("Started temp file cleanup scheduler (runs every 2 hours)")

if __name__ == "__main__":
    # Initialize database
    init_database()
    
    
    # Start cleanup scheduler
    start_cleanup_scheduler()
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)