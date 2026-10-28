from typing import List, Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Client, Engine


def get(db: Session, client_id: UUID) -> Optional[Client]:
    return db.query(Client).filter(Client.id == client_id).first()


def get_by_identification_number(db: Session, number: str) -> Optional[Client]:
    return db.query(Client).filter(Client.identification_number == number).first()


def list_all(db: Session, skip: int, limit: int) -> List[Client]:
    return (
        db.query(Client)
        .order_by(Client.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create(db: Session, data: dict) -> Client:
    client = Client(**data)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def update(db: Session, client: Client, data: dict) -> Client:
    for field, value in data.items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


def delete(db: Session, client: Client) -> None:
    db.delete(client)
    db.commit()


def count_engines(db: Session, client_id: UUID) -> int:
    return (
        db.query(func.count(Engine.id))
        .filter(Engine.client_id == client_id)
        .scalar()
        or 0
    )
