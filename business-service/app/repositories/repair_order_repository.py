from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Client,
    Engine,
    RepairOrder,
    RepairOrderStatus,
    RepairOrderStatusHistory,
)


def _with_relations(query):
    return query.options(
        joinedload(RepairOrder.client),
        joinedload(RepairOrder.engine),
    )


def get(db: Session, order_id: UUID) -> Optional[RepairOrder]:
    return (
        _with_relations(db.query(RepairOrder))
        .filter(RepairOrder.id == order_id)
        .first()
    )


def list_all(
    db: Session,
    skip: int,
    limit: int,
    status: Optional[str] = None,
    client_id: Optional[UUID] = None,
    engine_id: Optional[UUID] = None,
    search: Optional[str] = None,
) -> List[RepairOrder]:
    query = _with_relations(db.query(RepairOrder))

    if status:
        query = query.filter(RepairOrder.status == status)
    if client_id:
        query = query.filter(RepairOrder.client_id == client_id)
    if engine_id:
        query = query.filter(RepairOrder.engine_id == engine_id)
    if search:
        pattern = f"%{search}%"
        query = (
            query.join(Engine, RepairOrder.engine_id == Engine.id)
            .join(Client, RepairOrder.client_id == Client.id)
            .filter(
                or_(
                    RepairOrder.order_number.ilike(pattern),
                    Engine.serial_number.ilike(pattern),
                    Client.name.ilike(pattern),
                )
            )
        )

    return (
        query.order_by(RepairOrder.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_with_initial_history(
    db: Session,
    order_data: dict,
    changed_by: Optional[str],
) -> RepairOrder:
    order = RepairOrder(**order_data)
    db.add(order)
    db.flush()

    history = RepairOrderStatusHistory(
        repair_order_id=order.id,
        previous_status=None,
        new_status=order.status,
        changed_by=changed_by,
        notes="Estado inicial",
    )
    db.add(history)
    db.commit()
    db.refresh(order)
    return order


def update_status(
    db: Session,
    order: RepairOrder,
    new_status: str,
    changed_by: Optional[str],
    notes: Optional[str],
) -> RepairOrder:
    previous_status = order.status
    order.status = new_status

    if new_status == RepairOrderStatus.DELIVERED.value:
        order.actual_delivery = datetime.now(timezone.utc)

    history = RepairOrderStatusHistory(
        repair_order_id=order.id,
        previous_status=previous_status,
        new_status=new_status,
        changed_by=changed_by,
        notes=notes or f"Cambio de estado: {previous_status} -> {new_status}",
    )
    db.add(history)
    db.commit()
    db.refresh(order)
    return order


def list_history(db: Session, order_id: UUID) -> List[RepairOrderStatusHistory]:
    return (
        db.query(RepairOrderStatusHistory)
        .filter(RepairOrderStatusHistory.repair_order_id == order_id)
        .order_by(RepairOrderStatusHistory.changed_at.asc())
        .all()
    )
