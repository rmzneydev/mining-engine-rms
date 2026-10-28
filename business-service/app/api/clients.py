from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas import ClientCreate, ClientResponse, ClientUpdate
from app.services import client_service

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return client_service.create_client(db, client_in)


@router.get("/", response_model=List[ClientResponse])
def list_clients(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return client_service.list_clients(db, skip, limit)


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: UUID,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return client_service.get_client(db, client_id)


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: UUID,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return client_service.update_client(db, client_id, client_in)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: UUID,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    client_service.delete_client(db, client_id)
    return None
