from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Engine(Base):
    __tablename__ = "engines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    serial_number = Column(String(100), unique=True, nullable=False, index=True)
    manufacturer = Column(String(255), nullable=False)
    model = Column(String(255), nullable=False)
    engine_type = Column(String(255), nullable=False)
    power_capacity = Column(String(255), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    client = relationship("Client", back_populates="engines")
    repair_orders = relationship("RepairOrder", back_populates="engine")

    def __repr__(self):
        return f"<Engine(id={self.id}, serial_number={self.serial_number})>"
