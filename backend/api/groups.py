from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from uuid import uuid4

from app.database import get_db
from app.schemas import *
from models.user import User
from models.group import Group, GroupMembership
from models.naval_unit import NavalUnit
from utils.auth import get_current_active_user

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