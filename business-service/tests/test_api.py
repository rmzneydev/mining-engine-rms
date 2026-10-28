from uuid import uuid4

from fastapi.testclient import TestClient

from tests.helpers import TEST_USER_ID, auth_headers, make_token

CLIENT_PAYLOAD = {
    "name": "Minera Sur SAS",
    "identification_type": "NIT",
    "identification_number": "900123456-7",
    "email": "contacto@minerasur.com",
    "is_active": True,
}


def create_client(api: TestClient, headers: dict, **overrides) -> dict:
    response = api.post("/clients/", headers=headers, json={**CLIENT_PAYLOAD, **overrides})
    assert response.status_code == 201, response.text
    return response.json()


def create_engine(api: TestClient, headers: dict, client_id: str, **overrides) -> dict:
    payload = {
        "serial_number": "SN-157804",
        "manufacturer": "Caterpillar",
        "model": "C15",
        "engine_type": "Diésel",
        "power_capacity": "500 HP",
        "client_id": client_id,
        **overrides,
    }
    response = api.post("/engines/", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def create_order(api: TestClient, headers: dict, engine_id: str, **overrides) -> dict:
    payload = {
        "engine_id": engine_id,
        "problem_description": "Sobrecalentamiento del motor en operación",
        "technical_diagnosis": "Posible falla en el sistema de refrigeración",
        "technician_name": "Luis Pérez",
        "estimated_delivery": "2026-11-01T10:00:00Z",
        **overrides,
    }
    response = api.post("/repair-orders/", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_health_is_public(api: TestClient) -> None:
    response = api.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "business-service"}


def test_protected_routes_reject_missing_invalid_and_expired_tokens(api: TestClient) -> None:
    assert api.get("/clients/").status_code == 401
    assert api.get("/clients/", headers={"Authorization": "Bearer invalid"}).status_code == 401
    assert (
        api.get("/clients/", headers=auth_headers(make_token(expires_in=-60))).status_code
        == 401
    )
    assert (
        api.get(
            "/clients/", headers=auth_headers(make_token(audience="another-service"))
        ).status_code
        == 401
    )
    assert (
        api.get(
            "/clients/",
            headers=auth_headers(make_token(secret="wrong-secret-that-is-long-enough-for-hs256")),
        ).status_code
        == 401
    )


def test_client_crud_and_duplicate_validation(api: TestClient, headers: dict) -> None:
    client = create_client(api, headers)

    assert client["name"] == CLIENT_PAYLOAD["name"]
    assert client["identification_number"] == CLIENT_PAYLOAD["identification_number"]

    listed = api.get("/clients/", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    fetched = api.get(f"/clients/{client['id']}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["email"] == CLIENT_PAYLOAD["email"]

    updated = api.put(
        f"/clients/{client['id']}",
        headers=headers,
        json={"name": "Minera Sur Renombrada", "is_active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Minera Sur Renombrada"
    assert updated.json()["is_active"] is False

    duplicate = api.post(
        "/clients/",
        headers=headers,
        json={**CLIENT_PAYLOAD, "name": "Otra Minera"},
    )
    assert duplicate.status_code == 409

    invalid_email = api.post(
        "/clients/",
        headers=headers,
        json={
            **CLIENT_PAYLOAD,
            "identification_number": "NIT-999",
            "email": "not-an-email",
        },
    )
    assert invalid_email.status_code == 422

    deleted = api.delete(f"/clients/{client['id']}", headers=headers)
    assert deleted.status_code == 204


def test_engine_crud_and_referential_validation(api: TestClient, headers: dict) -> None:
    client = create_client(api, headers)
    engine = create_engine(api, headers, client["id"])

    assert engine["client_id"] == client["id"]
    assert engine["serial_number"] == "SN-157804"

    listed = api.get("/engines/", headers=headers, params={"client_id": client["id"]})
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    updated = api.put(
        f"/engines/{engine['id']}",
        headers=headers,
        json={"model": "C18", "is_active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["model"] == "C18"

    duplicate = api.post(
        "/engines/",
        headers=headers,
        json={
            "serial_number": "SN-157804",
            "manufacturer": "Caterpillar",
            "model": "C15",
            "engine_type": "Diésel",
            "power_capacity": "500 HP",
            "client_id": client["id"],
        },
    )
    assert duplicate.status_code == 409

    missing_client = api.post(
        "/engines/",
        headers=headers,
        json={
            "serial_number": "SN-999999",
            "manufacturer": "Caterpillar",
            "model": "C15",
            "engine_type": "Diésel",
            "power_capacity": "500 HP",
            "client_id": str(uuid4()),
        },
    )
    assert missing_client.status_code == 404

    deleted = api.delete(f"/engines/{engine['id']}", headers=headers)
    assert deleted.status_code == 204


def test_create_order_derives_client_and_initial_history(
    api: TestClient, headers: dict
) -> None:
    client = create_client(api, headers)
    engine = create_engine(api, headers, client["id"])
    order = create_order(api, headers, engine["id"])

    assert order["order_number"].startswith("RO-")
    assert order["status"] == "received"
    assert order["client_id"] == client["id"]
    assert order["engine_id"] == engine["id"]
    assert order["client"]["name"] == client["name"]
    assert order["engine"]["serial_number"] == engine["serial_number"]
    assert order["actual_delivery"] is None

    history = api.get(f"/repair-orders/{order['id']}/history", headers=headers)
    assert history.status_code == 200
    entries = history.json()
    assert len(entries) == 1
    assert entries[0]["previous_status"] is None
    assert entries[0]["new_status"] == "received"
    assert entries[0]["changed_by"] == TEST_USER_ID

    missing_engine = api.post(
        "/repair-orders/",
        headers=headers,
        json={"engine_id": str(uuid4()), "problem_description": "Sin motor"},
    )
    assert missing_engine.status_code == 404


def test_order_status_workflow_and_history(api: TestClient, headers: dict) -> None:
    client = create_client(api, headers)
    engine = create_engine(api, headers, client["id"])
    order = create_order(api, headers, engine["id"])

    invalid_transition = api.patch(
        f"/repair-orders/{order['id']}/status",
        headers=headers,
        json={"status": "repairing"},
    )
    assert invalid_transition.status_code == 400

    same_status = api.patch(
        f"/repair-orders/{order['id']}/status",
        headers=headers,
        json={"status": "received"},
    )
    assert same_status.status_code == 400

    transitions = [
        "diagnosing",
        "waiting_approval",
        "repairing",
        "testing",
        "finished",
        "delivered",
    ]

    for index, status in enumerate(transitions, start=1):
        response = api.patch(
            f"/repair-orders/{order['id']}/status",
            headers=headers,
            json={"status": status, "notes": f"Paso {index}"},
        )
        assert response.status_code == 200, response.text
        assert response.json()["status"] == status

    final = response.json()
    assert final["actual_delivery"] is not None

    history = api.get(f"/repair-orders/{order['id']}/history", headers=headers).json()
    assert len(history) == 7
    assert [entry["new_status"] for entry in history] == ["received", *transitions]
    assert history[-1]["notes"] == "Paso 6"

    closed = api.patch(
        f"/repair-orders/{order['id']}/status",
        headers=headers,
        json={"status": "repairing"},
    )
    assert closed.status_code == 400


def test_order_filters_and_search(api: TestClient, headers: dict) -> None:
    first_client = create_client(api, headers)
    first_engine = create_engine(api, headers, first_client["id"], serial_number="SN-AAA")
    first_order = create_order(api, headers, first_engine["id"])

    second_client = create_client(
        api,
        headers,
        name="Andes Mining",
        identification_number="NIT-ANDES",
    )
    second_engine = create_engine(
        api,
        headers,
        second_client["id"],
        serial_number="SN-BBB",
        manufacturer="Komatsu",
    )
    second_order = create_order(api, headers, second_engine["id"])

    api.patch(
        f"/repair-orders/{first_order['id']}/status",
        headers=headers,
        json={"status": "diagnosing"},
    )

    by_status = api.get(
        "/repair-orders/", headers=headers, params={"status": "diagnosing"}
    ).json()
    assert [order["id"] for order in by_status] == [first_order["id"]]

    by_client = api.get(
        "/repair-orders/", headers=headers, params={"client_id": second_client["id"]}
    ).json()
    assert [order["id"] for order in by_client] == [second_order["id"]]

    by_engine = api.get(
        "/repair-orders/", headers=headers, params={"engine_id": first_engine["id"]}
    ).json()
    assert [order["id"] for order in by_engine] == [first_order["id"]]

    by_order_number = api.get(
        "/repair-orders/",
        headers=headers,
        params={"search": second_order["order_number"]},
    ).json()
    assert [order["id"] for order in by_order_number] == [second_order["id"]]

    by_serial = api.get(
        "/repair-orders/", headers=headers, params={"search": "SN-AAA"}
    ).json()
    assert [order["id"] for order in by_serial] == [first_order["id"]]

    by_client_name = api.get(
        "/repair-orders/", headers=headers, params={"search": "Andes Mining"}
    ).json()
    assert [order["id"] for order in by_client_name] == [second_order["id"]]


def test_delete_guards_prevent_orphan_records(api: TestClient, headers: dict) -> None:
    client = create_client(api, headers)
    engine = create_engine(api, headers, client["id"])
    create_order(api, headers, engine["id"])

    client_delete = api.delete(f"/clients/{client['id']}", headers=headers)
    engine_delete = api.delete(f"/engines/{engine['id']}", headers=headers)

    assert client_delete.status_code == 409
    assert engine_delete.status_code == 409


def test_missing_resources_return_404(api: TestClient, headers: dict) -> None:
    missing = str(uuid4())

    assert api.get(f"/clients/{missing}", headers=headers).status_code == 404
    assert api.get(f"/engines/{missing}", headers=headers).status_code == 404
    assert api.get(f"/repair-orders/{missing}", headers=headers).status_code == 404
    assert api.get(f"/repair-orders/{missing}/history", headers=headers).status_code == 404
