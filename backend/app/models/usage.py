from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from app.database import Base
from datetime import date

class UsageLog(Base):
    __tablename__ = "usage_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    kwh_consumed = Column(Float, nullable=False)
    watts = Column(Float, nullable=False)
    recorded_at = Column(DateTime, server_default=func.now())
    date = Column(Date, default=date.today)