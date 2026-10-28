from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Engine, Client
from app.schemas import EngineCreate, EngineUpdate, EngineResponse

router = APIRouter(prefix="/engines", tags=["engines"])


@router.post("/", response_model=EngineResponse, status_code=status.HTTP_201_CREATED)
def create_engine(
    engine_in: EngineCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == engine_in.client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente propietario no encontrado",
        )

    existing = (
        db.query(Engine)
        .filter(Engine.serial_number == engine_in.serial_number)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un motor con ese número de serie",
        )

    engine = Engine(**engine_in.model_dump())
    db.add(engine)
    db.commit()
    db.refresh(engine)
    return engine


@router.get("/", response_model=List[EngineResponse])
def list_engines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return db.query(Engine).offset(skip).limit(limit).all()


@router.get("/{engine_id}", response_model=EngineResponse)
def get_engine(
    engine_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    engine = db.query(Engine).filter(Engine.id == engine_id).first()
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Motor no encontrado",
        )
    return engine


@router.put("/{engine_id}", response_model=EngineResponse)
def update_engine(
    engine_id: UUID,
    engine_in: EngineUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    engine = db.query(Engine).filter(Engine.id == engine_id).first()
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Motor no encontrado",
        )

    update_data = engine_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(engine, field, value)

    db.commit()
    db.refresh(engine)
    return engine


@router.delete("/{engine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_engine(
    engine_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    engine = db.query(Engine).filter(Engine.id == engine_id).first()
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Motor no encontrado",
        )
    db.delete(engine)
    db.commit()
    return None
