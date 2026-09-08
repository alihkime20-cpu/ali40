from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    telegram_bot_token: str
    admin_user_id: int = 7112435274
    required_channel: str = "@a11g9n"
    required_channel_url: str = "https://t.me/a11g9n"
    supabase_url: str
    supabase_service_role_key: str
    max_file_size_mb: int = 49
    download_timeout_seconds: int = 180
    log_level: str = "INFO"
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", case_sensitive=False, extra="ignore")
    @property
    def max_file_size_bytes(self) -> int: return self.max_file_size_mb * 1024 * 1024

@lru_cache
def get_settings() -> Settings: return Settings()
