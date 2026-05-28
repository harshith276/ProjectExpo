from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from jose import jwt, JWTError

from app.api.deps import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.user import UserSignup, UserLogin, UserCreate, UserResponse, Token, RefreshTokenRequest, SignupResponse, LoginResponse
from passlib.context import CryptContext
import logging
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/signup")
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    try:
        logger.info(f"Signup attempt for: {user_data.email}")
        
        # Check if email already exists
        existing_user = db.query(User).filter(
            User.email == user_data.email
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email already registered. Please sign in instead."
            )
        
        # Validate passwords match
        if user_data.password != user_data.confirm_password:
            raise HTTPException(
                status_code=400,
                detail="Passwords do not match."
            )
        
        # Validate password strength
        if len(user_data.password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters."
            )
        
        # Hash the password
        hashed_password = pwd_context.hash(user_data.password)
        logger.info("Password hashed successfully")
        
        # Create new user
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            display_name=user_data.email.split("@")[0],
            budget=150.0,
            preferred_currency="USD"
        )
        
        # Save to database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"✅ User created successfully: {user_data.email}")
        
        return {
            "message": "Account created successfully!",
            "email": new_user.email,
            "display_name": new_user.display_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Signup error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Server error during signup: {str(e)}"
        )

@router.post("/login", response_model=LoginResponse)
def login(credentials: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )
    
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(data={"sub": user.email}, expires_delta=refresh_token_expires)
    
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.utcnow() + refresh_token_expires
    )
    db.add(db_refresh_token)
    db.commit()

    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "display_name": user.display_name,
            "is_onboarded": user.is_onboarded
        }
    }

@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = request.refresh_token
    db_token = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    
    if not db_token or db_token.expires_at < datetime.utcnow():
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise credentials_exception
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    
    return {"access_token": access_token, "refresh_token": token, "token_type": "bearer"}
