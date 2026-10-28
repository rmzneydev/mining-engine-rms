"""Datos de demostración para el business-service.

Se ejecuta con `python -m app.seed`. Solo inserta datos si SEED_DEMO_DATA=true
y la base no tiene clientes, por lo que es seguro correrlo en cada arranque.
Usa los mismos servicios que la API para respetar validaciones, transiciones
de estado e historial.
"""

from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.models import Client, RepairOrderStatus
from app.schemas import ClientCreate, EngineCreate, RepairOrderCreate, RepairOrderStatusUpdate
from app.services import client_service, engine_service, repair_order_service

CLIENTS = [
    {
        "name": "Minera Andina del Norte S.A.S.",
        "identification_type": "NIT",
        "identification_number": "900123456-1",
        "email": "mantenimiento@andinadelnorte.example",
    },
    {
        "name": "Carbones del Cesar Ltda.",
        "identification_type": "NIT",
        "identification_number": "900654321-7",
        "email": "flota@carbonescesar.example",
    },
    {
        "name": "Transportes Mineros El Roble S.A.",
        "identification_type": "NIT",
        "identification_number": "800987654-3",
        "email": "taller@elroble.example",
    },
]

# (índice del cliente, datos del motor)
ENGINES = [
    (0, {"serial_number": "CAT-C32-0001", "manufacturer": "Caterpillar", "model": "C32", "engine_type": "Diésel V12", "power_capacity": "1600 HP"}),
    (0, {"serial_number": "CUM-QSK60-0002", "manufacturer": "Cummins", "model": "QSK60", "engine_type": "Diésel V16", "power_capacity": "2700 HP"}),
    (1, {"serial_number": "KOM-SAA12V140-0003", "manufacturer": "Komatsu", "model": "SAA12V140E", "engine_type": "Diésel V12", "power_capacity": "1250 HP"}),
    (1, {"serial_number": "MTU-16V4000-0004", "manufacturer": "MTU", "model": "16V4000", "engine_type": "Diésel V16", "power_capacity": "3500 HP"}),
    (2, {"serial_number": "CAT-3516B-0005", "manufacturer": "Caterpillar", "model": "3516B", "engine_type": "Diésel V16", "power_capacity": "2500 HP"}),
]

WORKFLOW = [
    RepairOrderStatus.DIAGNOSING,
    RepairOrderStatus.WAITING_APPROVAL,
    RepairOrderStatus.REPAIRING,
    RepairOrderStatus.TESTING,
    RepairOrderStatus.FINISHED,
    RepairOrderStatus.DELIVERED,
]

TRANSITION_NOTES = {
    RepairOrderStatus.DIAGNOSING: "Motor desmontado e ingresado a banco de diagnóstico",
    RepairOrderStatus.WAITING_APPROVAL: "Cotización enviada al cliente",
    RepairOrderStatus.REPAIRING: "Cliente aprobó la reparación",
    RepairOrderStatus.TESTING: "Reparación terminada, inicia prueba en dinamómetro",
    RepairOrderStatus.FINISHED: "Pruebas superadas dentro de parámetros del fabricante",
    RepairOrderStatus.DELIVERED: "Motor entregado al cliente",
}

# (índice del motor, estado final, datos de la orden)
ORDERS = [
    (0, RepairOrderStatus.RECEIVED, {
        "problem_description": "Pérdida de potencia y humo negro bajo carga",
        "technician_name": "Carlos Ramírez",
        "observations": "Ingresa con 18.500 horas de operación",
    }),
    (1, RepairOrderStatus.DIAGNOSING, {
        "problem_description": "Sobrecalentamiento recurrente en operación continua",
        "technician_name": "Luis Pérez",
    }),
    (2, RepairOrderStatus.WAITING_APPROVAL, {
        "problem_description": "Ruido metálico en el bloque y baja presión de aceite",
        "technical_diagnosis": "Desgaste severo de cojinetes de biela; cigüeñal requiere rectificado",
        "technician_name": "Andrés Gómez",
    }),
    (3, RepairOrderStatus.REPAIRING, {
        "problem_description": "Fuga de refrigerante hacia la cámara de combustión",
        "technical_diagnosis": "Junta de culata dañada en bancada B",
        "work_performed": "Cambio de juntas de culata y verificación de planitud",
        "technician_name": "María Torres",
    }),
    (4, RepairOrderStatus.TESTING, {
        "problem_description": "Arranque difícil en frío y consumo elevado de combustible",
        "technical_diagnosis": "Inyectores con patrón de pulverización irregular",
        "work_performed": "Reemplazo de 16 inyectores y calibración del sistema",
        "technician_name": "Carlos Ramírez",
    }),
    (0, RepairOrderStatus.FINISHED, {
        "problem_description": "Mantenimiento mayor por cumplimiento de horas",
        "technical_diagnosis": "Desgaste normal de componentes internos",
        "work_performed": "Overhaul completo: camisas, pistones, anillos y cojinetes",
        "technician_name": "Luis Pérez",
    }),
    (2, RepairOrderStatus.DELIVERED, {
        "problem_description": "Turbocompresor con juego axial excesivo",
        "technical_diagnosis": "Rodamientos del turbo desgastados",
        "work_performed": "Reemplazo del turbocompresor",
        "technician_name": "Andrés Gómez",
        "observations": "Garantía de 6 meses sobre el turbocompresor",
    }),
]


def seed_demo_data() -> bool:
    db = SessionLocal()
    try:
        if db.query(Client).first() is not None:
            return False

        clients = [client_service.create_client(db, ClientCreate(**data)) for data in CLIENTS]
        engines = [
            engine_service.create_engine(
                db, EngineCreate(**data, client_id=clients[client_index].id)
            )
            for client_index, data in ENGINES
        ]

        now = datetime.now(timezone.utc)
        for engine_index, target_status, data in ORDERS:
            order = repair_order_service.create_repair_order(
                db,
                RepairOrderCreate(
                    **data,
                    engine_id=engines[engine_index].id,
                    estimated_delivery=now + timedelta(days=15),
                ),
                None,
            )
            if target_status == RepairOrderStatus.RECEIVED:
                continue
            for status in WORKFLOW[: WORKFLOW.index(target_status) + 1]:
                repair_order_service.update_status(
                    db,
                    order.id,
                    RepairOrderStatusUpdate(status=status, notes=TRANSITION_NOTES[status]),
                    None,
                )
        return True
    finally:
        db.close()


def main() -> None:
    if not settings.SEED_DEMO_DATA:
        print("SEED_DEMO_DATA desactivado; no se cargan datos de demostración")
        return

    Base.metadata.create_all(bind=engine)
    if seed_demo_data():
        print("Datos de demostración cargados")
    else:
        print("La base ya tiene datos; se omite el seed de demostración")


if __name__ == "__main__":
    main()
