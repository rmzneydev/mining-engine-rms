from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import RepairOrder, Engine, Client, RepairOrderStatusHistory
from app.schemas import RepairOrderCreate, RepairOrderResponse

router = APIRouter(prefix="/repair-orders", tags=["repair-orders"])


def generate_order_number() -> str:
    return f"RO-{uuid.uuid4().hex[:8].upper()}"


@router.post("/", response_model=RepairOrderResponse, status_code=status.HTTP_201_CREATED)
def create_repair_order(
    order_in: RepairOrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    engine = db.query(Engine).filter(Engine.id == order_in.engine_id).first()
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Motor no encontrado",
        )

    client = db.query(Client).filter(Client.id == engine.client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente propietario del motor no encontrado",
        )

    order_number = generate_order_number()

    order = RepairOrder(
        order_number=order_number,
        engine_id=order_in.engine_id,
        client_id=engine.client_id,
        problem_description=order_in.problem_description,
        technical_diagnosis=order_in.technical_diagnosis,
        work_performed=order_in.work_performed,
        technician_name=order_in.technician_name,
        estimated_delivery=order_in.estimated_delivery,
        status=order_in.status,
        observations=order_in.observations,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    history = RepairOrderStatusHistory(
        repair_order_id=order.id,
        previous_status=None,
        new_status=order.status,
        changed_by=str(current_user.get("sub")),
        notes="Estado inicial",
    )
    db.add(history)
    db.commit()

    return order


@router.get("/", response_model=List[RepairOrderResponse])
def list_repair_orders(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = db.query(RepairOrder)
    if status_filter:
        query = query.filter(RepairOrder.status == status_filter)
    return query.offset(skip).limit(limit).all()


@router.get("/{order_id}", response_model=RepairOrderResponse)
def get_repair_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden de reparación no encontrada",
        )
    return order
