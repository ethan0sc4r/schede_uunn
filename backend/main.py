from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uuid
from pathlib import Path

from app.database import engine, Base
from api import auth, naval_units, groups, admin

# Create database tables
Base.metadata.create_all(bind=engine)

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
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Static files for uploaded images
app.mount("/api/static", StaticFiles(directory=str(UPLOAD_DIR)), name="static")

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(naval_units.router, prefix="/api/units", tags=["naval-units"])
app.include_router(groups.router, prefix="/api/groups", tags=["groups"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/")
async def root():
    return {"message": "Naval Units Management System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/upload-image")
async def upload_image(image: UploadFile = File(...)):
    """Upload an image file and return the file path"""
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        file_extension = image.filename.split(".")[-1] if "." in image.filename else "png"
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await image.read()
            buffer.write(content)
        
        # Return relative path for database storage
        return {"file_path": unique_filename}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)