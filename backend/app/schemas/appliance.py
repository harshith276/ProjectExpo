from pydantic import BaseModel


class ApplianceBase(BaseModel):
    name: str
    watts: int
    is_active: bool = False


class ApplianceCreate(ApplianceBase):
    pass


class ApplianceResponse(ApplianceBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
