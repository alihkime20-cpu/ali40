from functools import lru_cache
from urllib.parse import urlparse
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    telegram_bot_token: str
    admin_user_id: int = 7112435274
    supabase_url: str
    supabase_service_role_key: str
    max_file_size_mb: int = 50
    log_level: str = "INFO"
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", case_sensitive=False, extra="ignore")

    @field_validator("supabase_url", mode="before")
    @classmethod
    def validate_supabase_url(cls, value: str) -> str:
        value = str(value).strip().strip('"').strip("'")
        parsed = urlparse(value)
        if parsed.scheme != "https" or not parsed.netloc or parsed.path not in ("", "/"):
            raise ValueError("SUPABASE_URL must be only an HTTPS project URL, e.g. https://<project-ref>.supabase.co")
        if value.startswith("sb_") or "=" in value or "dashboard" in value:
            raise ValueError("SUPABASE_URL contains a key or dashboard URL; use only https://<project-ref>.supabase.co")
        return value.rstrip("/")

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

@lru_cache
def get_settings() -> Settings:
    return Settings()
