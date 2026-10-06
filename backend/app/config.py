from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    database_url: str
    site_origin: str = "http://localhost:3000"
    app_env: str = "development"
    session_hours: int = Field(default=12, ge=1, le=168)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def config() -> Config:
    return Config()
