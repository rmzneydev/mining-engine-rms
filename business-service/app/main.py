from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import clients, engines, repair_orders
from app.core.database import Base, engine
from app.core.exceptions import DomainError

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mining Engine RMS - Business Service",
    description=(
        "Gestión de clientes, motores y órdenes de reparación. "
        "Los endpoints protegidos requieren un JWT emitido por el auth-service."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router)
app.include_router(engines.router)
app.include_router(repair_orders.router)


@app.exception_handler(DomainError)
async def domain_error_handler(_request: Request, exc: DomainError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/health")
def health():
    return {"status": "ok", "service": "business-service"}
