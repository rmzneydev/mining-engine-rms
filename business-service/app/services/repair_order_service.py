import uuid
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError, NotFoundError
from app.models import RepairOrder, RepairOrderStatus, RepairOrderStatusHistory
from app.repositories import engine_repository, repair_order_repository
from app.schemas import RepairOrderCreate, RepairOrderStatusUpdate

ALLOWED_TRANSITIONS = {
    RepairOrderStatus.RECEIVED: {RepairOrderStatus.DIAGNOSING},
    RepairOrderStatus.DIAGNOSING: {
        RepairOrderStatus.WAITING_APPROVAL,
        RepairOrderStatus.REPAIRING,
    },
    RepairOrderStatus.WAITING_APPROVAL: {RepairOrderStatus.REPAIRING},
    RepairOrderStatus.REPAIRING: {RepairOrderStatus.TESTING},
    RepairOrderStatus.TESTING: {
        RepairOrderStatus.FINISHED,
        RepairOrderStatus.REPAIRING,
    },
    RepairOrderStatus.FINISHED: {RepairOrderStatus.DELIVERED},
    RepairOrderStatus.DELIVERED: set(),
}


def generate_order_number() -> str:
    return f"RO-{uuid.uuid4().hex[:8].upper()}"


def create_repair_order(
    db: Session,
    data: RepairOrderCreate,
    changed_by: Optional[str],
) -> RepairOrder:
    engine = engine_repository.get(db, data.engine_id)
    if not engine:
        raise NotFoundError("Motor no encontrado")

    payload = data.model_dump()
    payload["order_number"] = generate_order_number()
    payload["status"] = RepairOrderStatus.RECEIVED.value
    payload["client_id"] = engine.client_id

    return repair_order_repository.create_with_initial_history(
        db, payload, changed_by
    )


def list_repair_orders(
    db: Session,
    skip: int,
    limit: int,
    status: Optional[RepairOrderStatus] = None,
    client_id: Optional[UUID] = None,
    engine_id: Optional[UUID] = None,
    search: Optional[str] = None,
) -> List[RepairOrder]:
    return repair_order_repository.list_all(
        db,
        skip,
        limit,
        status=status.value if status else None,
        client_id=client_id,
        engine_id=engine_id,
        search=search,
    )


def get_repair_order(db: Session, order_id: UUID) -> RepairOrder:
    order = repair_order_repository.get(db, order_id)
    if not order:
        raise NotFoundError("Orden de reparación no encontrada")
    return order


def list_status_history(
    db: Session, order_id: UUID
) -> List[RepairOrderStatusHistory]:
    get_repair_order(db, order_id)
    return repair_order_repository.list_history(db, order_id)


def update_status(
    db: Session,
    order_id: UUID,
    data: RepairOrderStatusUpdate,
    changed_by: Optional[str],
) -> RepairOrder:
    order = get_repair_order(db, order_id)

    try:
        current_status = RepairOrderStatus(order.status)
    except ValueError as exc:
        raise BadRequestError(
            f"La orden tiene un estado desconocido: {order.status}"
        ) from exc

    new_status = data.status

    if new_status == current_status:
        raise BadRequestError(
            f"La orden ya se encuentra en estado '{current_status.value}'"
        )

    allowed = ALLOWED_TRANSITIONS[current_status]
    if new_status not in allowed:
        allowed_values = ", ".join(s.value for s in allowed) or "ninguno"
        raise BadRequestError(
            f"Transición no permitida de '{current_status.value}' a "
            f"'{new_status.value}'. Estados permitidos: {allowed_values}"
        )

    return repair_order_repository.update_status(
        db, order, new_status.value, changed_by, data.notes
    )
