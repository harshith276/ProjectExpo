from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.sql import false
from app.database import Base


class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    watts = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=False, server_default=false())
