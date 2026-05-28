from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.appliance import Appliance
from app.schemas.appliance import ApplianceCreate, ApplianceResponse

router = APIRouter()


# ------------------------------------------------------------------
# GET /api/appliances/
# Returns all appliances for the logged-in user.
# ------------------------------------------------------------------
@router.get("/", response_model=List[ApplianceResponse])
def get_user_appliances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Appliance)
        .filter(Appliance.user_id == current_user.id)
        .all()
    )


# ------------------------------------------------------------------
# POST /api/appliances/
# Creates a new appliance for the logged-in user.
# ------------------------------------------------------------------
@router.post("/", response_model=ApplianceResponse, status_code=status.HTTP_201_CREATED)
def create_appliance(
    appliance_data: ApplianceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_appliance = Appliance(
        user_id=current_user.id,
        name=appliance_data.name,
        watts=appliance_data.watts,
        is_active=appliance_data.is_active,
    )
    db.add(new_appliance)
    db.commit()
    db.refresh(new_appliance)
    return new_appliance


# ------------------------------------------------------------------
# PUT /api/appliances/{appliance_id}/toggle
# Flips the is_active status of a specific appliance.
# ------------------------------------------------------------------
@router.put("/{appliance_id}/toggle", response_model=ApplianceResponse)
def toggle_appliance(
    appliance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appliance = (
        db.query(Appliance)
        .filter(Appliance.id == appliance_id, Appliance.user_id == current_user.id)
        .first()
    )
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")

    appliance.is_active = not appliance.is_active
    db.commit()
    db.refresh(appliance)
    return appliance


# ------------------------------------------------------------------
# DELETE /api/appliances/{appliance_id}
# Permanently removes an appliance.
# ------------------------------------------------------------------
@router.delete("/{appliance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appliance(
    appliance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appliance = (
        db.query(Appliance)
        .filter(Appliance.id == appliance_id, Appliance.user_id == current_user.id)
        .first()
    )
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")

    db.delete(appliance)
    db.commit()
    return None


# ------------------------------------------------------------------
# POST /api/appliances/defaults  (kept for onboarding wizard)
# Bulk-inserts a list of appliances in a single transaction.
# ------------------------------------------------------------------
@router.post(
    "/defaults",
    response_model=List[ApplianceResponse],
    status_code=status.HTTP_201_CREATED,
)
def add_default_appliances(
    appliances_data: List[ApplianceCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_appliances = []
    for app_data in appliances_data:
        new_app = Appliance(
            user_id=current_user.id,
            name=app_data.name,
            watts=app_data.watts,
            is_active=app_data.is_active,
        )
        db.add(new_app)
        new_appliances.append(new_app)

    db.commit()
    for app in new_appliances:
        db.refresh(app)

    return new_appliances
