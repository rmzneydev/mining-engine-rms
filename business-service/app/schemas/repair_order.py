from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class RepairOrderCreate(BaseModel):
    engine_id: uuid.UUID
    problem_description: str
    technical_diagnosis: Optional[str] = None
    work_performed: Optional[str] = None
    technician_name: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    status: str = "received"
    observations: Optional[str] = None


class RepairOrderResponse(BaseModel):
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
    status: str
    observations: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
