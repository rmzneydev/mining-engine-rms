from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "postgresql+psycopg://mining_user:mining_dev_password@localhost:5432/business_db"
    JWT_SECRET: SecretStr
    JWT_ISSUER: str = "auth-service"
    JWT_AUDIENCE: str = "business-service"
    SEED_DEMO_DATA: bool = False

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value().encode("utf-8")) < 32:
            raise ValueError("JWT_SECRET must be at least 32 bytes")
        return value


settings = Settings()
