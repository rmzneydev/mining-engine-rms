from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class RepairOrder(Base):
    __tablename__ = "repair_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(100), unique=True, nullable=False, index=True)
    engine_id = Column(UUID(as_uuid=True), ForeignKey("engines.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    received_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    problem_description = Column(Text, nullable=False)
    technical_diagnosis = Column(Text, nullable=True)
    work_performed = Column(Text, nullable=True)
    technician_name = Column(String(255), nullable=True)
    estimated_delivery = Column(DateTime(timezone=True), nullable=True)
    actual_delivery = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, default="received")
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    engine = relationship("Engine", back_populates="repair_orders")
    client = relationship("Client", back_populates="repair_orders")
    status_history = relationship("RepairOrderStatusHistory", back_populates="repair_order")

    def __repr__(self):
        return f"<RepairOrder(id={self.id}, order_number={self.order_number})>"
