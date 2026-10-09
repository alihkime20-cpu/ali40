from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    telegram_bot_token: str
    admin_user_id: int = 7112435274
    required_channel: str = "@a11g9n"
    required_channel_url: str = "https://t.me/a11g9n"
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    openai_api_key: str | None = None
    car_part_vision_model: str = "gpt-4o-mini"
    max_image_size_mb: int = 8
    image_analysis_cooldown_seconds: int = 15
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def max_image_size_bytes(self) -> int:
        return self.max_image_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
