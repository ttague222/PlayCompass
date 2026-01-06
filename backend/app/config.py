"""
PlayCompass Backend Configuration
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App settings
    app_name: str = "PlayCompass API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8080

    # Firebase settings
    firebase_project_id: str = "playcompass-640d4"
    google_application_credentials: str | None = None

    # CORS settings
    cors_origins: list[str] = [
        "http://localhost:8081",
        "http://localhost:19006",
        "exp://localhost:8081",
        "https://playcompass.web.app",
    ]

    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds

    # Sentry (error tracking)
    sentry_dsn: str | None = None
    sentry_environment: str = "production"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
