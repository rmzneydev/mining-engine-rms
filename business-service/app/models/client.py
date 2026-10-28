from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    identification_type = Column(String(50), nullable=False)
    identification_number = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    engines = relationship("Engine", back_populates="client")
    repair_orders = relationship("RepairOrder", back_populates="client")

    def __repr__(self):
        return f"<Client(id={self.id}, name={self.name})>"
