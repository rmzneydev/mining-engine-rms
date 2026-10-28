from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas import EngineCreate, EngineResponse, EngineUpdate
from app.services import engine_service

router = APIRouter(prefix="/engines", tags=["engines"])


@router.post("/", response_model=EngineResponse, status_code=status.HTTP_201_CREATED)
def create_engine(
    engine_in: EngineCreate,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return engine_service.create_engine(db, engine_in)


@router.get("/", response_model=List[EngineResponse])
def list_engines(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    client_id: Optional[UUID] = Query(default=None),
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return engine_service.list_engines(db, skip, limit, client_id=client_id)


@router.get("/{engine_id}", response_model=EngineResponse)
def get_engine(
    engine_id: UUID,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return engine_service.get_engine(db, engine_id)


@router.put("/{engine_id}", response_model=EngineResponse)
def update_engine(
    engine_id: UUID,
    engine_in: EngineUpdate,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    return engine_service.update_engine(db, engine_id, engine_in)


@router.delete("/{engine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_engine(
    engine_id: UUID,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    engine_service.delete_engine(db, engine_id)
    return None
