# app/config.py
from __future__ import annotations

from functools import lru_cache
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ========= Supabase =========
    supabase_url: Optional[str] = Field(default=None, alias="SUPABASE_URL")
    supabase_key: Optional[str] = Field(default=None, alias="SUPABASE_KEY")  # anon key
    supabase_service_key: Optional[str] = Field(default=None, alias="SUPABASE_SERVICE_KEY")  # service_role

    # ========= OpenAI =========
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    embed_model: str = Field(default="text-embedding-3-small", alias="EMBED_MODEL")
    openai_temperature: float = Field(default=0.7, alias="OPENAI_TEMPERATURE")  # ADD THIS


    # ========= App / Env =========
    environment: str = Field(default="development", alias="ENVIRONMENT")
    api_version: str = Field(default="v1", alias="API_VERSION")
    host: str = Field(default="127.0.0.1", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # ========= Security / Auth =========
    secret_key: Optional[str] = Field(default=None, alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    # ========= Limits =========
    max_query_complexity: int = Field(default=500, alias="MAX_QUERY_COMPLEXITY")
    rate_limit_requests: int = Field(default=100, alias="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=100, alias="RATE_LIMIT_WINDOW")
    max_response_tokens: int = Field(default=1000, alias="MAX_RESPONSE_TOKENS")

    # ========= CORS (comma-separated) =========
    allowed_origins: str = Field(default="http://localhost:3000,http://127.0.0.1:3000", alias="ALLOWED_ORIGINS")
    allowed_methods: str = Field(default="GET,POST,PUT,DELETE", alias="ALLOWED_METHODS")
    allowed_headers: str = Field(default="*", alias="ALLOWED_HEADERS")

    # ========= Monitoring =========
    sentry_dsn: Optional[str] = Field(default=None, alias="SENTRY_DSN")

    # Pydantic Settings config
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",   # don't crash if an extra env var is present
    )

    # Convenience properties for CORS
    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def allowed_methods_list(self) -> List[str]:
        return [m.strip() for m in self.allowed_methods.split(",") if m.strip()]

    @property
    def allowed_headers_list(self) -> List[str]:
        return [h.strip() for h in self.allowed_headers.split(",") if h.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Singleton-ish accessor so we don't parse .env repeatedly."""
    return Settings()