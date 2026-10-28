from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
import uuid

from app.models.enums import RepairOrderStatus


class ClientSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    identification_number: str


class EngineSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    serial_number: str
    manufacturer: str
    model: str


class RepairOrderCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    engine_id: uuid.UUID
    problem_description: str = Field(min_length=1)
    technical_diagnosis: Optional[str] = None
    work_performed: Optional[str] = None
    technician_name: Optional[str] = Field(default=None, max_length=255)
    estimated_delivery: Optional[datetime] = None
    status: RepairOrderStatus = RepairOrderStatus.RECEIVED
    observations: Optional[str] = None


class RepairOrderStatusUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    status: RepairOrderStatus
    notes: Optional[str] = Field(default=None, max_length=500)


class RepairOrderStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    previous_status: Optional[str]
    new_status: str
    changed_by: Optional[str]
    changed_at: datetime
    notes: Optional[str]


class RepairOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_number: str
    engine_id: uuid.UUID
    client_id: uuid.UUID
    received_at: datetime
    problem_description: str
    technical_diagnosis: Optional[str]
    work_performed: Optional[str]
    technician_name: Optional[str]
    estimated_delivery: Optional[datetime]
    actual_delivery: Optional[datetime]
    status: RepairOrderStatus
    observations: Optional[str]
    created_at: datetime
    updated_at: datetime
    client: Optional[ClientSummary] = None
    engine: Optional[EngineSummary] = None
