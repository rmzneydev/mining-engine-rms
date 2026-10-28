from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models import Client
from app.repositories import client_repository
from app.schemas import ClientCreate, ClientUpdate


def create_client(db: Session, data: ClientCreate) -> Client:
    if client_repository.get_by_identification_number(db, data.identification_number):
        raise ConflictError("Ya existe un cliente con ese número de identificación")
    return client_repository.create(db, data.model_dump())


def list_clients(db: Session, skip: int, limit: int) -> List[Client]:
    return client_repository.list_all(db, skip, limit)


def get_client(db: Session, client_id: UUID) -> Client:
    client = client_repository.get(db, client_id)
    if not client:
        raise NotFoundError("Cliente no encontrado")
    return client


def update_client(db: Session, client_id: UUID, data: ClientUpdate) -> Client:
    client = get_client(db, client_id)
    payload = data.model_dump(exclude_unset=True)

    new_number = payload.get("identification_number")
    if new_number and new_number != client.identification_number:
        existing = client_repository.get_by_identification_number(db, new_number)
        if existing and existing.id != client.id:
            raise ConflictError("Ya existe un cliente con ese número de identificación")

    return client_repository.update(db, client, payload)


def delete_client(db: Session, client_id: UUID) -> None:
    client = get_client(db, client_id)
    if client_repository.count_engines(db, client.id) > 0:
        raise ConflictError(
            "No se puede eliminar un cliente con motores asociados"
        )
    client_repository.delete(db, client)
