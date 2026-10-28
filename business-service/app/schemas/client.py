from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class ClientCreate(BaseModel):
    name: str
    identification_type: str
    identification_number: str
    email: Optional[str] = None
    is_active: bool = True


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    identification_type: Optional[str] = None
    identification_number: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class ClientResponse(BaseModel):
    id: uuid.UUID
    name: str
    identification_type: str
    identification_number: str
    email: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
