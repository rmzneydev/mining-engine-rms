from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt

TEST_SECRET = "test_secret_for_business_service_1234567890"
TEST_ISSUER = "auth-service"
TEST_AUDIENCE = "business-service"
TEST_USER_ID = "11111111-1111-1111-1111-111111111111"


def make_token(
    *,
    sub: str = TEST_USER_ID,
    role: str = "operator",
    issuer: str = TEST_ISSUER,
    audience: str = TEST_AUDIENCE,
    secret: str = TEST_SECRET,
    expires_in: int = 3600,
) -> str:
    payload = {
        "sub": sub,
        "email": "operator@test.com",
        "role": role,
        "iss": issuer,
        "aud": audience,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=expires_in),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def auth_headers(token: Optional[str] = None) -> dict:
    return {"Authorization": f"Bearer {token or make_token()}"}
