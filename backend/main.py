from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import SessionLocal, engine, Base
from app.schemas import *
from models.user import User
from models.naval_unit import NavalUnit, UnitCharacteristic
from models.group import Group, GroupMembership
from utils.auth import *
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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded images
app.mount("/static", StaticFiles(directory="uploads"), name="static")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)