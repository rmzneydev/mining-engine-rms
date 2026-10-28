from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class EngineCreate(BaseModel):
    serial_number: str
    manufacturer: str
    model: str
    engine_type: str
    power_capacity: str
    client_id: uuid.UUID


class EngineUpdate(BaseModel):
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    engine_type: Optional[str] = None
    power_capacity: Optional[str] = None
    client_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class EngineResponse(BaseModel):
    id: uuid.UUID
    serial_number: str
    manufacturer: str
    model: str
    engine_type: str
    power_capacity: str
    client_id: uuid.UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
