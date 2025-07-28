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

from app.simple_database import SimpleDatabase, init_database
from utils.powerpoint_export import create_group_powerpoint, create_unit_powerpoint

app = FastAPI(
    title="Naval Units Management System",
    description="API for managing naval unit information sheets",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174", 
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:5176", "http://127.0.0.1:5176",
        "http://localhost:5177", "http://127.0.0.1:5177",
        "http://localhost:3000", "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Create data and uploads directories if they don't exist
os.makedirs("./data", exist_ok=True)
UPLOAD_DIR = "./data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Static files for uploaded images
app.mount("/api/static", StaticFiles(directory=UPLOAD_DIR), name="static")

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

@app.post("/api/units")
async def create_naval_unit(unit: NavalUnitCreate, user: dict = Depends(get_current_user)):
    unit_id = SimpleDatabase.create_naval_unit(
        name=unit.name,
        unit_class=unit.unit_class,
        nation=unit.nation,
        background_color=unit.background_color,
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
async def export_unit_powerpoint(unit_id: int, template_config: dict = None, user: dict = Depends(get_current_user)):
    """Export a single naval unit to PowerPoint presentation"""
    
    try:
        print(f"Single unit PowerPoint export requested for unit ID: {unit_id}")
        
        # Get the unit with all related data
        unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
        if not unit:
            print(f"Unit {unit_id} not found")
            raise HTTPException(status_code=404, detail="Naval unit not found")
        
        print(f"Unit found: {unit['name']}")
        
        # Create temporary file for PowerPoint
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pptx') as tmp_file:
            output_path = tmp_file.name
        
        print(f"Temporary file created: {output_path}")
        print(f"Template config: {template_config}")
        
        # Generate PowerPoint presentation using single unit function
        created_path = create_unit_powerpoint(unit, output_path, template_config)
        print(f"PowerPoint created successfully: {created_path}")
        
        # Create exports directory if it doesn't exist
        exports_dir = "./data/exports"
        os.makedirs(exports_dir, exist_ok=True)
        print(f"Exports directory ensured: {exports_dir}")
        
        # Create final filename with better handling
        safe_name = "".join(c for c in unit['name'] if c.isalnum() or c in (' ', '-', '_')).rstrip()
        if not safe_name:  # Fallback if name becomes empty
            safe_name = f"unit_{unit_id}"
        final_filename = f"{safe_name}_scheda.pptx"
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
        print(f"Single unit PowerPoint export error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Clean up temp file on error
        if 'output_path' in locals() and os.path.exists(output_path):
            os.unlink(output_path)
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating PowerPoint presentation: {str(e)}"
        )

@app.get("/api/units/{unit_id}/export/pdf")
async def export_unit_pdf(unit_id: int, group_id: Optional[int] = None, user: dict = Depends(get_current_user)):
    # TODO: Implement PDF export
    raise HTTPException(status_code=501, detail="PDF export not implemented")

@app.get("/api/units/{unit_id}/export/png")
async def export_unit_png(unit_id: int, group_id: Optional[int] = None, user: dict = Depends(get_current_user)):
    # TODO: Implement PNG export
    raise HTTPException(status_code=501, detail="PNG export not implemented")

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
        
        # Create temporary file for PowerPoint
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pptx') as tmp_file:
            output_path = tmp_file.name
        
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

if __name__ == "__main__":
    # Initialize database
    init_database()
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)