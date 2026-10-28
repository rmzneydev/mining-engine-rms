from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
import uuid

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class ClientCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)
    identification_type: str = Field(min_length=1, max_length=50)
    identification_number: str = Field(min_length=1, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255, pattern=EMAIL_PATTERN)
    is_active: bool = True


class ClientUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    identification_type: Optional[str] = Field(default=None, min_length=1, max_length=50)
    identification_number: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255, pattern=EMAIL_PATTERN)
    is_active: Optional[bool] = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    identification_type: str
    identification_number: str
    email: Optional[str]
    is_active: bool
    created_at: datetime
