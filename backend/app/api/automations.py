from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.automation import Automation
from app.schemas.automation import AutomationCreate, AutomationResponse

router = APIRouter()

@router.get("/", response_model=List[AutomationResponse])
def get_user_automations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Automation)
        .filter(Automation.user_id == current_user.id)
        .all()
    )

@router.post("/", response_model=AutomationResponse, status_code=status.HTTP_201_CREATED)
def create_automation(
    automation_data: AutomationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_automation = Automation(
        user_id=current_user.id,
        name=automation_data.name,
        threshold_watts=automation_data.threshold_watts,
        target_appliance_id=automation_data.target_appliance_id,
        is_active=automation_data.is_active,
    )
    db.add(new_automation)
    db.commit()
    db.refresh(new_automation)
    return new_automation

@router.put("/{automation_id}/toggle", response_model=AutomationResponse)
def toggle_automation(
    automation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    automation = (
        db.query(Automation)
        .filter(Automation.id == automation_id, Automation.user_id == current_user.id)
        .first()
    )
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")

    automation.is_active = not automation.is_active
    db.commit()
    db.refresh(automation)
    return automation

@router.delete("/{automation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_automation(
    automation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    automation = (
        db.query(Automation)
        .filter(Automation.id == automation_id, Automation.user_id == current_user.id)
        .first()
    )
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")

    db.delete(automation)
    db.commit()
    return None
