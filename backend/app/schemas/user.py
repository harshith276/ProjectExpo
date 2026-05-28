from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    display_name: Optional[str] = None
    budget: float
    preferred_currency: str
    house_size: Optional[str] = None
    people_count: Optional[str] = None
    location: Optional[str] = None
    is_onboarded: bool = False
    state: Optional[str] = None
    monthly_unit_limit: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SignupResponse(BaseModel):
    message: str
    email: EmailStr

class LoginUser(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None
    is_onboarded: bool = False

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: LoginUser

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    house_size: Optional[str] = None
    people_count: Optional[str] = None
    location: Optional[str] = None
    is_onboarded: Optional[bool] = None

class UserBudgetUpdate(BaseModel):
    budget: float

class UserSettingsUpdate(BaseModel):
    budget: Optional[float] = None
    state: Optional[str] = None
    monthly_unit_limit: Optional[float] = None

class UserCurrencyUpdate(BaseModel):
    preferred_currency: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    email: Optional[str] = None
