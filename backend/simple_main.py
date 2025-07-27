from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
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

from app.simple_database import SimpleDatabase

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
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded images
app.mount("/static", StaticFiles(directory="../uploads"), name="static")

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
UPLOAD_DIR = "../uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".svg"}

def save_uploaded_file(file: UploadFile, subfolder: str) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    unique_filename = f"{uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, subfolder, unique_filename)
    
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path

# Routes
@app.get("/")
async def root():
    return {"message": "Naval Units Management System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

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
    user = SimpleDatabase.get_user_by_email(user_credentials.email)
    if not user or not SimpleDatabase.verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user["is_active"]:
        raise HTTPException(status_code=401, detail="Account not activated")
    
    access_token = create_access_token(data={"sub": user["email"]})
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
@app.post("/api/units/{unit_id}/upload-logo")
async def upload_logo(unit_id: int, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    unit = SimpleDatabase.get_naval_unit_by_id(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    file_path = save_uploaded_file(file, "logos")
    # TODO: Update unit with logo path in database
    return {"message": "Logo uploaded successfully", "file_path": file_path}

# Admin routes
@app.get("/api/admin/users")
async def get_all_users(admin: dict = Depends(get_admin_user)):
    # TODO: Implement get all users
    return {"message": "Admin feature - get all users"}

@app.post("/api/admin/users/{user_id}/activate")
async def activate_user(user_id: int, admin: dict = Depends(get_admin_user)):
    if SimpleDatabase.activate_user(user_id):
        return {"message": "User activated successfully"}
    raise HTTPException(status_code=404, detail="User not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)