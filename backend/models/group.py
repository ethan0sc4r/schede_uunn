from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    
    # Hierarchy support for subgroups
    parent_group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    
    # Template override settings
    template_logo_path = Column(String, nullable=True)
    template_flag_path = Column(String, nullable=True)
    override_logo = Column(Boolean, default=False)
    override_flag = Column(Boolean, default=False)
    
    # Presentation settings
    presentation_config = Column(JSON, nullable=True)  # Store presentation settings
    
    # Group images (for the group itself, not template)
    logo_path = Column(String, nullable=True)
    flag_path = Column(String, nullable=True)
    
    # User who created this group
    created_by = Column(Integer, ForeignKey("users.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="groups")
    memberships = relationship("GroupMembership", back_populates="group", cascade="all, delete-orphan")
    
    # Self-referential relationship for subgroups
    parent_group = relationship("Group", remote_side=[id], backref="subgroups")

class GroupMembership(Base):
    __tablename__ = "group_memberships"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    naval_unit_id = Column(Integer, ForeignKey("naval_units.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    group = relationship("Group", back_populates="memberships")
    naval_unit = relationship("NavalUnit", back_populates="group_memberships")