from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserProfileUpdate, UserBudgetUpdate, UserSettingsUpdate, UserCurrencyUpdate

router = APIRouter()

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(profile_data: UserProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if profile_data.display_name is not None:
        current_user.display_name = profile_data.display_name
    if profile_data.email is not None:
        existing_email = db.query(User).filter(User.email == profile_data.email).first()
        if existing_email and existing_email.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = profile_data.email
        
    if profile_data.house_size is not None:
        current_user.house_size = profile_data.house_size
    if profile_data.people_count is not None:
        current_user.people_count = profile_data.people_count
    if profile_data.location is not None:
        current_user.location = profile_data.location
    if profile_data.is_onboarded is not None:
        current_user.is_onboarded = profile_data.is_onboarded
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/budget", response_model=UserResponse)
def update_budget(budget_data: UserBudgetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.budget = budget_data.budget
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/settings", response_model=UserResponse)
def update_settings(settings_data: UserSettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if settings_data.budget is not None:
        current_user.budget = settings_data.budget
    if settings_data.state is not None:
        current_user.state = settings_data.state
    if settings_data.monthly_unit_limit is not None:
        current_user.monthly_unit_limit = settings_data.monthly_unit_limit
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/currency", response_model=UserResponse)
def update_currency(currency_data: UserCurrencyUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.preferred_currency = currency_data.preferred_currency
    db.commit()
    db.refresh(current_user)
    return current_user
