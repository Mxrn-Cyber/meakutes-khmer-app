from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "mysql+pymysql://meakutes:changeme@localhost:3306/meakutes_khmer"

    secret_key: str = "dev-only-change-me"
    session_cookie_name: str = "mk_session"
    session_expire_minutes: int = 60 * 24 * 30  # 30 days
    # Production (HTTPS) must set COOKIE_SECURE=true.
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    google_client_id: str = ""

    cors_origins: str = "http://localhost:5173"

    media_root: str = "./media"
    media_url_prefix: str = "/media"

    # "local" for development, "r2" for production (see app/storage.py)
    storage_backend: str = "local"
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = ""
    r2_public_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
