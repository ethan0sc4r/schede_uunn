from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class NavalUnit(Base):
    __tablename__ = "naval_units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    unit_class = Column(String, nullable=False, index=True)
    nation = Column(String, nullable=True, index=True)
    
    # Image paths
    logo_path = Column(String, nullable=True)
    silhouette_path = Column(String, nullable=True)
    flag_path = Column(String, nullable=True)
    
    # Layout customization
    background_color = Column(String, default="#ffffff")
    layout_config = Column(JSON, nullable=True)
    
    # Silhouette zoom and positioning
    silhouette_zoom = Column(String, default="1.0")
    silhouette_position_x = Column(String, default="0")
    silhouette_position_y = Column(String, default="0")
    
    # User who created this unit
    created_by = Column(Integer, ForeignKey("users.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="naval_units")
    characteristics = relationship("UnitCharacteristic", back_populates="naval_unit", cascade="all, delete-orphan")
    group_memberships = relationship("GroupMembership", back_populates="naval_unit")

class UnitCharacteristic(Base):
    __tablename__ = "unit_characteristics"

    id = Column(Integer, primary_key=True, index=True)
    naval_unit_id = Column(Integer, ForeignKey("naval_units.id"))
    characteristic_name = Column(String, nullable=False)
    characteristic_value = Column(Text, nullable=False)
    order_index = Column(Integer, default=0)
    
    # Relationship
    naval_unit = relationship("NavalUnit", back_populates="characteristics")