from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import clients, engines, repair_orders
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mining Engine RMS - Business Service",
    description="Gestión de clientes, motores y órdenes de reparación",
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


@app.get("/health")
def health():
    return {"status": "ok", "service": "business-service"}
