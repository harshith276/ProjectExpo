from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    display_name = Column(String, nullable=True)
    budget = Column(Float, default=150.0)
    preferred_currency = Column(String, default="USD")
    
    house_size = Column(String, nullable=True)
    people_count = Column(String, nullable=True)
    location = Column(String, nullable=True)
    is_onboarded = Column(Boolean, default=False)
    
    # Settings fields for Indian state electricity slabs
    state = Column(String, default="Tamil Nadu")
    monthly_unit_limit = Column(Float, default=200.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
