from typing import List, Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Engine, RepairOrder


def get(db: Session, engine_id: UUID) -> Optional[Engine]:
    return db.query(Engine).filter(Engine.id == engine_id).first()


def get_by_serial_number(db: Session, serial_number: str) -> Optional[Engine]:
    return db.query(Engine).filter(Engine.serial_number == serial_number).first()


def list_all(
    db: Session,
    skip: int,
    limit: int,
    client_id: Optional[UUID] = None,
) -> List[Engine]:
    query = db.query(Engine)
    if client_id:
        query = query.filter(Engine.client_id == client_id)
    return query.order_by(Engine.created_at.desc()).offset(skip).limit(limit).all()


def create(db: Session, data: dict) -> Engine:
    engine = Engine(**data)
    db.add(engine)
    db.commit()
    db.refresh(engine)
    return engine


def update(db: Session, engine: Engine, data: dict) -> Engine:
    for field, value in data.items():
        setattr(engine, field, value)
    db.commit()
    db.refresh(engine)
    return engine


def delete(db: Session, engine: Engine) -> None:
    db.delete(engine)
    db.commit()


def count_repair_orders(db: Session, engine_id: UUID) -> int:
    return (
        db.query(func.count(RepairOrder.id))
        .filter(RepairOrder.engine_id == engine_id)
        .scalar()
        or 0
    )
