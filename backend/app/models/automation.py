from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base

class Automation(Base):
    __tablename__ = "automations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    threshold_watts = Column(Integer, nullable=False)
    target_appliance_id = Column(Integer, ForeignKey("appliances.id"), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
