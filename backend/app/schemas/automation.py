from pydantic import BaseModel

class AutomationBase(BaseModel):
    name: str
    threshold_watts: int
    target_appliance_id: int
    is_active: bool = True

class AutomationCreate(AutomationBase):
    pass

class AutomationResponse(AutomationBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
