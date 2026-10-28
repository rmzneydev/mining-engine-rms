from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models import Engine
from app.repositories import client_repository, engine_repository
from app.schemas import EngineCreate, EngineUpdate


def _ensure_client_exists(db: Session, client_id: UUID) -> None:
    if not client_repository.get(db, client_id):
        raise NotFoundError("Cliente propietario no encontrado")


def create_engine(db: Session, data: EngineCreate) -> Engine:
    _ensure_client_exists(db, data.client_id)

    if engine_repository.get_by_serial_number(db, data.serial_number):
        raise ConflictError("Ya existe un motor con ese número de serie")

    return engine_repository.create(db, data.model_dump())


def list_engines(
    db: Session,
    skip: int,
    limit: int,
    client_id: Optional[UUID] = None,
) -> List[Engine]:
    return engine_repository.list_all(db, skip, limit, client_id=client_id)


def get_engine(db: Session, engine_id: UUID) -> Engine:
    engine = engine_repository.get(db, engine_id)
    if not engine:
        raise NotFoundError("Motor no encontrado")
    return engine


def update_engine(db: Session, engine_id: UUID, data: EngineUpdate) -> Engine:
    engine = get_engine(db, engine_id)
    payload = data.model_dump(exclude_unset=True)

    new_client_id = payload.get("client_id")
    if new_client_id and new_client_id != engine.client_id:
        _ensure_client_exists(db, new_client_id)

    new_serial = payload.get("serial_number")
    if new_serial and new_serial != engine.serial_number:
        existing = engine_repository.get_by_serial_number(db, new_serial)
        if existing and existing.id != engine.id:
            raise ConflictError("Ya existe un motor con ese número de serie")

    return engine_repository.update(db, engine, payload)


def delete_engine(db: Session, engine_id: UUID) -> None:
    engine = get_engine(db, engine_id)
    if engine_repository.count_repair_orders(db, engine.id) > 0:
        raise ConflictError(
            "No se puede eliminar un motor con órdenes de reparación asociadas"
        )
    engine_repository.delete(db, engine)
