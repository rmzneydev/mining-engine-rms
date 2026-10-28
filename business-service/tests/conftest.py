import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from tests.helpers import (
    TEST_AUDIENCE,
    TEST_ISSUER,
    TEST_SECRET,
    make_token,
)

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://mining_user:mining_dev_password@localhost:5432/business_test_db",
)
ADMIN_DATABASE_URL = os.getenv(
    "TEST_ADMIN_DATABASE_URL",
    "postgresql+psycopg://mining_user:mining_dev_password@localhost:5432/postgres",
)
TEST_DATABASE_NAME = make_url(TEST_DATABASE_URL).database

assert TEST_DATABASE_NAME, "TEST_DATABASE_URL debe incluir el nombre de la base"


def _ensure_test_database() -> None:
    admin_engine = create_engine(ADMIN_DATABASE_URL, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as connection:
        exists = connection.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": TEST_DATABASE_NAME},
        ).scalar()
        if not exists:
            connection.execute(text(f'CREATE DATABASE "{TEST_DATABASE_NAME}"'))
    admin_engine.dispose()


_ensure_test_database()

os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["JWT_SECRET"] = TEST_SECRET
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["JWT_ISSUER"] = TEST_ISSUER
os.environ["JWT_AUDIENCE"] = TEST_AUDIENCE


@pytest.fixture(scope="session")
def api() -> TestClient:
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def clean_database(api: TestClient):
    from app.core.database import SessionLocal

    with SessionLocal() as session:
        session.execute(
            text(
                "TRUNCATE TABLE repair_order_status_history, repair_orders, "
                "engines, clients RESTART IDENTITY CASCADE"
            )
        )
        session.commit()

    yield


@pytest.fixture
def headers() -> dict:
    return {"Authorization": f"Bearer {make_token()}"}
