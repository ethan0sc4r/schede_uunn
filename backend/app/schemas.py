from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Unit Characteristic schemas
class CharacteristicBase(BaseModel):
    characteristic_name: str
    characteristic_value: str
    order_index: int = 0

class CharacteristicCreate(CharacteristicBase):
    pass

class CharacteristicResponse(CharacteristicBase):
    id: int
    naval_unit_id: int
    
    class Config:
        from_attributes = True

# Naval Unit schemas
class NavalUnitBase(BaseModel):
    name: str
    unit_class: str
    nation: Optional[str] = None
    background_color: str = "#ffffff"
    layout_config: Optional[Dict[str, Any]] = None
    silhouette_zoom: str = "1.0"
    silhouette_position_x: str = "0"
    silhouette_position_y: str = "0"

class NavalUnitCreate(NavalUnitBase):
    characteristics: List[CharacteristicCreate] = []

class NavalUnitUpdate(BaseModel):
    name: Optional[str] = None
    unit_class: Optional[str] = None
    nation: Optional[str] = None
    background_color: Optional[str] = None
    layout_config: Optional[Dict[str, Any]] = None
    silhouette_zoom: Optional[str] = None
    silhouette_position_x: Optional[str] = None
    silhouette_position_y: Optional[str] = None
    characteristics: Optional[List[CharacteristicCreate]] = None

class NavalUnitResponse(NavalUnitBase):
    id: int
    logo_path: Optional[str] = None
    silhouette_path: Optional[str] = None
    flag_path: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    characteristics: List[CharacteristicResponse] = []
    
    class Config:
        from_attributes = True

# Group schemas
class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    naval_unit_ids: List[int] = []

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    naval_unit_ids: Optional[List[int]] = None

class GroupResponse(GroupBase):
    id: int
    logo_path: Optional[str] = None
    flag_path: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    naval_units: List[NavalUnitResponse] = []
    
    class Config:
        from_attributes = True

# Search schemas
class SearchParams(BaseModel):
    query: str
    search_type: Optional[str] = "all"  # "name", "class", "nation", "all"

class SearchResponse(BaseModel):
    naval_units: List[NavalUnitResponse]
    total_count: int