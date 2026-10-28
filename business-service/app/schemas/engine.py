from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
import uuid


class EngineCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    serial_number: str = Field(min_length=1, max_length=100)
    manufacturer: str = Field(min_length=1, max_length=255)
    model: str = Field(min_length=1, max_length=255)
    engine_type: str = Field(min_length=1, max_length=255)
    power_capacity: str = Field(min_length=1, max_length=255)
    client_id: uuid.UUID


class EngineUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    serial_number: Optional[str] = Field(default=None, min_length=1, max_length=100)
    manufacturer: Optional[str] = Field(default=None, min_length=1, max_length=255)
    model: Optional[str] = Field(default=None, min_length=1, max_length=255)
    engine_type: Optional[str] = Field(default=None, min_length=1, max_length=255)
    power_capacity: Optional[str] = Field(default=None, min_length=1, max_length=255)
    client_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class EngineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    serial_number: str
    manufacturer: str
    model: str
    engine_type: str
    power_capacity: str
    client_id: uuid.UUID
    is_active: bool
    created_at: datetime
