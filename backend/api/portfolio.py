from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from pydantic import BaseModel
import jwt

from app.simple_database import SimpleDatabase

router = APIRouter()

# Pydantic models
class TemplateVisibilityUpdate(BaseModel):
    is_public: bool

class AddUnitToPortfolio(BaseModel):
    naval_unit_id: int
    template_id: str
    customizations: Optional[dict] = None

# Reuse auth function from main
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        print(f"🔍 Portfolio auth - Token received: {credentials.credentials[:20]}...")
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        print(f"🔍 Portfolio auth - Email from token: {email}")
        
        if email is None:
            print("🔍 Portfolio auth - No email in token")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = SimpleDatabase.get_user_by_email(email)
        if not user:
            print(f"🔍 Portfolio auth - User not found: {email}")
            raise HTTPException(status_code=401, detail="User not found")
        
        if not user["is_active"]:
            print(f"🔍 Portfolio auth - User not active: {email}")
            raise HTTPException(status_code=401, detail="User not active")
        
        print(f"🔍 Portfolio auth - Success for user: {user['id']} ({email})")
        return user
    except jwt.PyJWTError as e:
        print(f"🔍 Portfolio auth - JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

# Portfolio endpoints - nuovo sistema semplificato
@router.get("/portfolio")
def get_user_portfolio(
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Ottieni il portfolio dell'utente con ricerca opzionale"""
    units = SimpleDatabase.get_user_portfolio(current_user["id"], search)
    return {"portfolio_units": units, "total": len(units)}

@router.post("/portfolio/add")
def add_to_portfolio(
    unit_data: AddUnitToPortfolio,
    current_user: dict = Depends(get_current_user)
):
    """Aggiungi unità al portfolio con template specifico"""
    print(f"🔍 Portfolio API - Received data:")
    print(f"  User: {current_user['id']}")
    print(f"  Naval Unit ID: {unit_data.naval_unit_id}")
    print(f"  Template ID: {unit_data.template_id}")
    print(f"  Customizations: {unit_data.customizations}")
    
    element_states = unit_data.customizations.get('element_states', {}) if unit_data.customizations else {}
    canvas_config = unit_data.customizations.get('canvas_config', {}) if unit_data.customizations else {}
    
    print(f"  Element states count: {len(element_states)}")
    if element_states:
        print(f"  Element types: {[el.get('type', 'unknown') for el in element_states.values()]}")
    
    portfolio_unit_id = SimpleDatabase.add_unit_to_user_portfolio(
        user_id=current_user["id"],
        naval_unit_id=unit_data.naval_unit_id,
        template_id=unit_data.template_id,
        element_states=element_states,
        canvas_config=canvas_config
    )
    
    if not portfolio_unit_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add unit to portfolio"
        )
    
    return {"message": "Unità aggiunta al portfolio", "portfolio_unit_id": portfolio_unit_id}

@router.get("/portfolio/{naval_unit_id}/templates/{template_id}")
def get_portfolio_unit(
    naval_unit_id: int,
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Ottieni i dati di una specifica unità nel portfolio"""
    portfolio_unit = SimpleDatabase.get_user_portfolio_unit(current_user["id"], naval_unit_id, template_id)
    if not portfolio_unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio unit not found"
        )
    return portfolio_unit

@router.delete("/portfolio/{naval_unit_id}/templates/{template_id}")
def remove_from_portfolio(
    naval_unit_id: int,
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Rimuovi unità dal portfolio"""
    success = SimpleDatabase.remove_from_user_portfolio(current_user["id"], naval_unit_id, template_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio unit not found"
        )
    return {"message": "Unità rimossa dal portfolio"}

@router.post("/portfolio/create-group")
def create_group_from_portfolio(
    group_data: dict,  # {"name": "Group Name", "description": "...", "portfolio_unit_ids": [1,2,3]}
    current_user: dict = Depends(get_current_user)
):
    """Crea un gruppo dalle unità selezionate nel portfolio"""
    group_id = SimpleDatabase.create_group_from_portfolio_selection(
        user_id=current_user["id"],
        group_name=group_data["name"],
        description=group_data.get("description", ""),
        selected_portfolio_units=group_data["portfolio_unit_ids"]
    )
    
    if not group_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create group from portfolio"
        )
    
    return {"message": "Gruppo creato dal portfolio", "group_id": group_id}

@router.get("/portfolios/{portfolio_id}")
def get_portfolio(
    portfolio_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific portfolio with its units"""
    portfolio = SimpleDatabase.get_portfolio_by_id(portfolio_id, current_user["id"])
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    return portfolio

@router.delete("/portfolios/{portfolio_id}")
def delete_portfolio(
    portfolio_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a portfolio"""
    success = SimpleDatabase.delete_portfolio(portfolio_id, current_user["id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    return {"message": "Portfolio deleted successfully"}

# Portfolio unit management
@router.post("/portfolios/{portfolio_id}/units")
def add_unit_to_portfolio(
    portfolio_id: int,
    unit_data: AddUnitToPortfolio,
    current_user: dict = Depends(get_current_user)
):
    """Add a unit with specific template to portfolio"""
    # Verify portfolio belongs to user
    portfolio = SimpleDatabase.get_portfolio_by_id(portfolio_id, current_user["id"])
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    unit_id = SimpleDatabase.add_unit_to_portfolio(
        portfolio_id, unit_data.naval_unit_id, unit_data.template_id, unit_data.customizations
    )
    if not unit_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add unit to portfolio"
        )
    
    return {
        "id": unit_id,
        "portfolio_id": portfolio_id,
        "naval_unit_id": unit_data.naval_unit_id,
        "template_id": unit_data.template_id,
        "customizations": unit_data.customizations
    }

@router.put("/portfolios/{portfolio_id}/units/{naval_unit_id}/templates/{template_id}")
def update_portfolio_unit_customizations(
    portfolio_id: int,
    naval_unit_id: int,
    template_id: str,
    customizations: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update customizations for a specific unit in portfolio"""
    # Verify portfolio belongs to user
    portfolio = SimpleDatabase.get_portfolio_by_id(portfolio_id, current_user["id"])
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    success = SimpleDatabase.update_portfolio_unit_customizations(
        portfolio_id, naval_unit_id, template_id, customizations
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio unit not found"
        )
    
    return {"message": "Unit customizations updated successfully"}

@router.delete("/portfolios/{portfolio_id}/units/{naval_unit_id}/templates/{template_id}")
def remove_unit_from_portfolio(
    portfolio_id: int,
    naval_unit_id: int,
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a unit from portfolio"""
    # Verify portfolio belongs to user
    portfolio = SimpleDatabase.get_portfolio_by_id(portfolio_id, current_user["id"])
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    success = SimpleDatabase.remove_unit_from_portfolio(
        portfolio_id, naval_unit_id, template_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio unit not found"
        )
    
    return {"message": "Unit removed from portfolio successfully"}

# Template browsing for portfolio
@router.get("/templates/public")
def get_public_templates(current_user: dict = Depends(get_current_user)):
    """Get all public templates with creator information for portfolio browsing"""
    templates = SimpleDatabase.get_public_templates_with_users()
    return {"templates": templates}

@router.get("/templates/user")
def get_user_own_templates(current_user: dict = Depends(get_current_user)):
    """Get only user's own templates for template management"""
    templates = SimpleDatabase.get_user_templates(current_user["id"])
    return {"templates": templates}

@router.put("/templates/{template_id}/visibility")
def update_template_visibility(
    template_id: str,
    is_public: bool,
    current_user: dict = Depends(get_current_user)
):
    """Update template visibility (public/private)"""
    # Get template to verify ownership
    template = SimpleDatabase.get_template(template_id, current_user["id"])
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Update template with new visibility
    template_data = template.copy()
    template_data['isPublic'] = is_public
    
    success = SimpleDatabase.update_template(template_id, template_data, current_user["id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update template visibility"
        )
    
    return {"message": f"Template {'made public' if is_public else 'made private'} successfully"}