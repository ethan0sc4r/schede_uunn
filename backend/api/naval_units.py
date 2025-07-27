from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
import os
import shutil
from uuid import uuid4
from datetime import datetime

from app.database import get_db
from app.schemas import *
from models.user import User
from models.naval_unit import NavalUnit, UnitCharacteristic
from models.group import Group, GroupMembership
from utils.auth import get_current_active_user
from utils.export import create_naval_unit_pdf, create_naval_unit_image

router = APIRouter()

UPLOAD_DIR = "../data/uploads"
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

@router.get("/", response_model=List[NavalUnitResponse])
def get_naval_units(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    units = db.query(NavalUnit).options(joinedload(NavalUnit.creator)).offset(skip).limit(limit).all()
    return units

@router.get("/{unit_id}", response_model=NavalUnitResponse)
def get_naval_unit(
    unit_id: int, 
    db: Session = Depends(get_db)
):
    unit = db.query(NavalUnit).filter(NavalUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    return unit

@router.post("/", response_model=NavalUnitResponse)
def create_naval_unit(
    unit: NavalUnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check for uniqueness
    existing_unit = db.query(NavalUnit).filter(
        NavalUnit.name == unit.name,
        NavalUnit.unit_class == unit.unit_class
    ).first()
    
    if existing_unit:
        raise HTTPException(
            status_code=400,
            detail="A naval unit with this name and class already exists"
        )
    
    # Create the naval unit
    db_unit = NavalUnit(
        **unit.dict(exclude={'characteristics'}),
        created_by=current_user.id
    )
    
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    
    # Add characteristics
    for char in unit.characteristics:
        db_char = UnitCharacteristic(
            **char.dict(),
            naval_unit_id=db_unit.id
        )
        db.add(db_char)
    
    db.commit()
    db.refresh(db_unit)
    
    return db_unit

@router.put("/{unit_id}", response_model=NavalUnitResponse)
def update_naval_unit(
    unit_id: int,
    unit_update: NavalUnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_unit = db.query(NavalUnit).filter(NavalUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    # Update basic fields
    update_data = unit_update.dict(exclude_unset=True, exclude={'characteristics'})
    for key, value in update_data.items():
        setattr(db_unit, key, value)
    
    # Update characteristics if provided
    if unit_update.characteristics is not None:
        # Remove old characteristics
        db.query(UnitCharacteristic).filter(
            UnitCharacteristic.naval_unit_id == unit_id
        ).delete()
        
        # Add new characteristics
        for char in unit_update.characteristics:
            db_char = UnitCharacteristic(
                **char.dict(),
                naval_unit_id=unit_id
            )
            db.add(db_char)
    
    db.commit()
    db.refresh(db_unit)
    
    return db_unit

@router.delete("/{unit_id}")
def delete_naval_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_unit = db.query(NavalUnit).filter(NavalUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    db.delete(db_unit)
    db.commit()
    
    return {"message": "Naval unit deleted successfully"}

@router.post("/{unit_id}/upload-logo")
def upload_logo(
    unit_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_unit = db.query(NavalUnit).filter(NavalUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    file_path = save_uploaded_file(file, "logos")
    db_unit.logo_path = file_path
    db.commit()
    
    return {"message": "Logo uploaded successfully", "file_path": file_path}

@router.post("/{unit_id}/upload-silhouette")
def upload_silhouette(
    unit_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_unit = db.query(NavalUnit).filter(NavalUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    file_path = save_uploaded_file(file, "silhouettes")
    db_unit.silhouette_path = file_path
    db.commit()
    
    return {"message": "Silhouette uploaded successfully", "file_path": file_path}

@router.post("/{unit_id}/upload-flag")
def upload_flag(
    unit_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_unit = db.query(NavalUnit).filter(NavalUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    file_path = save_uploaded_file(file, "flags")
    db_unit.flag_path = file_path
    db.commit()
    
    return {"message": "Flag uploaded successfully", "file_path": file_path}

@router.get("/search/", response_model=SearchResponse)
def search_naval_units(
    q: str,
    search_type: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(NavalUnit)
    
    if search_type == "name":
        query = query.filter(NavalUnit.name.ilike(f"%{q}%"))
    elif search_type == "class":
        query = query.filter(NavalUnit.unit_class.ilike(f"%{q}%"))
    elif search_type == "nation":
        query = query.filter(NavalUnit.nation.ilike(f"%{q}%"))
    else:  # search_type == "all"
        query = query.filter(
            or_(
                NavalUnit.name.ilike(f"%{q}%"),
                NavalUnit.unit_class.ilike(f"%{q}%"),
                NavalUnit.nation.ilike(f"%{q}%")
            )
        )
    
    units = query.all()
    
    return SearchResponse(
        naval_units=units,
        total_count=len(units)
    )

@router.get("/{unit_id}/export/pdf")
def export_unit_pdf(
    unit_id: int,
    group_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the naval unit
    unit = db.query(NavalUnit).filter(NavalUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    # Prepare unit data
    unit_data = {
        'name': unit.name,
        'unit_class': unit.unit_class,
        'nation': unit.nation,
        'logo_path': unit.logo_path,
        'silhouette_path': unit.silhouette_path,
        'flag_path': unit.flag_path,
        'silhouette_zoom': unit.silhouette_zoom,
        'silhouette_position_x': unit.silhouette_position_x,
        'silhouette_position_y': unit.silhouette_position_y,
        'characteristics': [
            {
                'characteristic_name': char.characteristic_name,
                'characteristic_value': char.characteristic_value,
                'order_index': char.order_index
            }
            for char in unit.characteristics
        ]
    }
    
    # Get group override data if specified
    group_override = None
    if group_id:
        group = db.query(Group).filter(Group.id == group_id).first()
        if group:
            group_override = {
                'logo_path': group.logo_path,
                'flag_path': group.flag_path
            }
    
    # Create output directory if it doesn't exist
    export_dir = "../data/exports"
    os.makedirs(export_dir, exist_ok=True)
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"naval_unit_{unit_id}_{timestamp}.pdf"
    output_path = os.path.join(export_dir, filename)
    
    # Create the PDF
    create_naval_unit_pdf(unit_data, output_path, group_override)
    
    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename=f"{unit.name.replace(' ', '_')}.pdf"
    )

@router.get("/{unit_id}/export/png")
def export_unit_png(
    unit_id: int,
    group_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the naval unit
    unit = db.query(NavalUnit).filter(NavalUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Naval unit not found")
    
    # Prepare unit data (same as PDF export)
    unit_data = {
        'name': unit.name,
        'unit_class': unit.unit_class,
        'nation': unit.nation,
        'logo_path': unit.logo_path,
        'silhouette_path': unit.silhouette_path,
        'flag_path': unit.flag_path,
        'silhouette_zoom': unit.silhouette_zoom,
        'characteristics': [
            {
                'characteristic_name': char.characteristic_name,
                'characteristic_value': char.characteristic_value,
                'order_index': char.order_index
            }
            for char in unit.characteristics
        ]
    }
    
    # Get group override data if specified
    group_override = None
    if group_id:
        group = db.query(Group).filter(Group.id == group_id).first()
        if group:
            group_override = {
                'logo_path': group.logo_path,
                'flag_path': group.flag_path
            }
    
    # Create output directory if it doesn't exist
    export_dir = "../data/exports"
    os.makedirs(export_dir, exist_ok=True)
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"naval_unit_{unit_id}_{timestamp}.png"
    output_path = os.path.join(export_dir, filename)
    
    # Create the PNG
    create_naval_unit_image(unit_data, output_path, group_override, "PNG")
    
    return FileResponse(
        output_path,
        media_type="image/png",
        filename=f"{unit.name.replace(' ', '_')}.png"
    )