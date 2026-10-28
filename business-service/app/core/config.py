from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://mining_user:mining_dev_password@localhost:5432/business_db"
    JWT_SECRET: str = "dev_secret_change_this_to_a_long_random_value_123456789"
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "auth-service"
    JWT_AUDIENCE: str = "business-service"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
