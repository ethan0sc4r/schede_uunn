from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from uuid import uuid4
import tempfile

from app.database import get_db
from app.schemas import *
from models.user import User
from models.group import Group, GroupMembership
from models.naval_unit import NavalUnit
from utils.auth import get_current_active_user
from utils.powerpoint_export import create_group_powerpoint

router = APIRouter()

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

@router.get("/", response_model=List[GroupResponse])
def get_groups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    groups = db.query(Group).offset(skip).limit(limit).all()
    
    # Load naval units for each group
    for group in groups:
        group.naval_units = [membership.naval_unit for membership in group.memberships]
    
    return groups

@router.get("/{group_id}", response_model=GroupResponse)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Load naval units
    group.naval_units = [membership.naval_unit for membership in group.memberships]
    
    return group

@router.post("/", response_model=GroupResponse)
def create_group(
    group: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Create the group
    db_group = Group(
        name=group.name,
        description=group.description,
        created_by=current_user.id
    )
    
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Add naval unit memberships
    for unit_id in group.naval_unit_ids:
        # Verify that the naval unit exists
        unit = db.query(NavalUnit).filter(NavalUnit.id == unit_id).first()
        if not unit:
            raise HTTPException(
                status_code=400,
                detail=f"Naval unit with ID {unit_id} not found"
            )
        
        membership = GroupMembership(
            group_id=db_group.id,
            naval_unit_id=unit_id
        )
        db.add(membership)
    
    db.commit()
    db.refresh(db_group)
    
    # Load naval units for response
    db_group.naval_units = [membership.naval_unit for membership in db_group.memberships]
    
    return db_group

@router.put("/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: int,
    group_update: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Update basic fields
    if group_update.name is not None:
        db_group.name = group_update.name
    if group_update.description is not None:
        db_group.description = group_update.description
    
    # Update naval unit memberships if provided
    if group_update.naval_unit_ids is not None:
        # Remove old memberships
        db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id
        ).delete()
        
        # Add new memberships
        for unit_id in group_update.naval_unit_ids:
            # Verify that the naval unit exists
            unit = db.query(NavalUnit).filter(NavalUnit.id == unit_id).first()
            if not unit:
                raise HTTPException(
                    status_code=400,
                    detail=f"Naval unit with ID {unit_id} not found"
                )
            
            membership = GroupMembership(
                group_id=group_id,
                naval_unit_id=unit_id
            )
            db.add(membership)
    
    db.commit()
    db.refresh(db_group)
    
    # Load naval units for response
    db_group.naval_units = [membership.naval_unit for membership in db_group.memberships]
    
    return db_group

@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    db.delete(db_group)
    db.commit()
    
    return {"message": "Group deleted successfully"}

@router.post("/{group_id}/upload-logo")
def upload_group_logo(
    group_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    file_path = save_uploaded_file(file, "groups")
    db_group.logo_path = file_path
    db.commit()
    
    return {"message": "Group logo uploaded successfully", "file_path": file_path}

@router.post("/{group_id}/upload-flag")
def upload_group_flag(
    group_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    file_path = save_uploaded_file(file, "groups")
    db_group.flag_path = file_path
    db.commit()
    
    return {"message": "Group flag uploaded successfully", "file_path": file_path}

@router.get("/{group_id}/export/powerpoint")
def export_group_powerpoint(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Export a group's naval units to PowerPoint presentation"""
    
    # Get the group with all related data
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Load naval units with full layout data
    naval_units = []
    for membership in db_group.memberships:
        unit = membership.naval_unit
        # Convert unit to dict with all necessary data
        unit_data = {
            'id': unit.id,
            'name': unit.name,
            'unit_class': unit.unit_class,
            'nation': unit.nation,
            'layout_config': unit.layout_config,
            'creator': {
                'first_name': unit.creator.first_name if unit.creator else '',
                'last_name': unit.creator.last_name if unit.creator else ''
            }
        }
        naval_units.append(unit_data)
    
    # Prepare group data for PowerPoint export
    group_data = {
        'id': db_group.id,
        'name': db_group.name,
        'description': db_group.description,
        'naval_units': naval_units,
        'presentation_config': db_group.presentation_config or {
            'mode': 'single',
            'interval': 5,
            'grid_rows': 3,
            'grid_cols': 3,
            'auto_advance': True,
            'page_duration': 10
        },
        'override_logo': db_group.override_logo,
        'override_flag': db_group.override_flag,
        'template_logo_path': db_group.template_logo_path,
        'template_flag_path': db_group.template_flag_path
    }
    
    # Create temporary file for PowerPoint
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pptx') as tmp_file:
        output_path = tmp_file.name
    
    try:
        # Generate PowerPoint presentation
        created_path = create_group_powerpoint(group_data, output_path)
        
        # Create exports directory if it doesn't exist
        exports_dir = "./data/exports"
        os.makedirs(exports_dir, exist_ok=True)
        
        # Create final filename
        safe_name = "".join(c for c in db_group.name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        final_filename = f"{safe_name}_presentation.pptx"
        final_path = os.path.join(exports_dir, final_filename)
        
        # Move file to exports directory
        shutil.move(created_path, final_path)
        
        # Return file response
        return FileResponse(
            path=final_path,
            filename=final_filename,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
        
    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(output_path):
            os.unlink(output_path)
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating PowerPoint presentation: {str(e)}"
        )