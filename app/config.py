"""
Configuration management for the Mental Health LLM Backend.
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database Configuration
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_key: str = Field(..., env="SUPABASE_KEY")
    supabase_service_key: str = Field(None, env="SUPABASE_SERVICE_KEY")
    
    # OpenAI Configuration
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    openai_model: str = Field("gpt-4-turbo-preview", env="OPENAI_MODEL")
    openai_temperature: float = Field(0.1, env="OPENAI_TEMPERATURE")
    
    # Application Configuration
    environment: str = Field("development", env="ENVIRONMENT")
    log_level: str = Field("INFO", env="LOG_LEVEL")
    api_version: str = Field("v1", env="API_VERSION")
    host: str = Field("0.0.0.0", env="HOST")
    port: int = Field(8000, env="PORT")
    
    # Security Configuration
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = Field("HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Query Limits
    max_query_complexity: int = Field(100, env="MAX_QUERY_COMPLEXITY")
    rate_limit_requests: int = Field(60, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(60, env="RATE_LIMIT_WINDOW")
    max_response_tokens: int = Field(1000, env="MAX_RESPONSE_TOKENS")
    
    # CORS Settings
    allowed_origins: str = Field(
        "http://localhost:3000,http://localhost:8080", 
        env="ALLOWED_ORIGINS"
    )
    allowed_methods: str = Field("GET,POST,PUT,DELETE", env="ALLOWED_METHODS")
    allowed_headers: str = Field("*", env="ALLOWED_HEADERS")
    
    # Monitoring
    sentry_dsn: str = Field(None, env="SENTRY_DSN")
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated origins to list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    @property
    def allowed_methods_list(self) -> List[str]:
        """Convert comma-separated methods to list."""
        return [method.strip() for method in self.allowed_methods.split(",")]
    
    @property
    def allowed_headers_list(self) -> List[str]:
        """Convert comma-separated headers to list."""
        if self.allowed_headers == "*":
            return ["*"]
        return [header.strip() for header in self.allowed_headers.split(",")]
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Dependency to get settings instance."""
    return settings