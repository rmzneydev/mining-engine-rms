from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import RepairOrderStatus
from app.schemas import (
    RepairOrderCreate,
    RepairOrderResponse,
    RepairOrderStatusHistoryResponse,
    RepairOrderStatusUpdate,
)
from app.services import repair_order_service

router = APIRouter(prefix="/repair-orders", tags=["repair-orders"])


@router.post("/", response_model=RepairOrderResponse, status_code=status.HTTP_201_CREATED)
def create_repair_order(
    order_in: RepairOrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return repair_order_service.create_repair_order(
        db, order_in, current_user.get("sub")
    )


@router.get("/", response_model=List[RepairOrderResponse])
def list_repair_orders(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    status_filter: Optional[RepairOrderStatus] = Query(default=None, alias="status"),
    client_id: Optional[UUID] = Query(default=None),
    engine_id: Optional[UUID] = Query(default=None),
    search: Optional[str] = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return repair_order_service.list_repair_orders(
        db,
        skip,
        limit,
        status=status_filter,
        client_id=client_id,
        engine_id=engine_id,
        search=search,
    )


@router.get(
    "/{order_id}/history",
    response_model=List[RepairOrderStatusHistoryResponse],
)
def get_repair_order_history(
    order_id: UUID,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return repair_order_service.list_status_history(db, order_id)


@router.get("/{order_id}", response_model=RepairOrderResponse)
def get_repair_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return repair_order_service.get_repair_order(db, order_id)


@router.patch("/{order_id}/status", response_model=RepairOrderResponse)
def update_repair_order_status(
    order_id: UUID,
    payload: RepairOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return repair_order_service.update_status(
        db, order_id, payload, current_user.get("sub")
    )
