from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://redis:6379/0"
    jwt_secret: str
    jwt_issuer: str = "parenting-rewards"
    access_token_expire_minutes: int = 10080
    cors_origins: str = "http://localhost:3000"
    default_parent_email: str = "parent@example.com"
    default_parent_password: str = "ChangeMe123!"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
