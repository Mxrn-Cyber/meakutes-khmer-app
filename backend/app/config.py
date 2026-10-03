from functools import lru_cache

import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator
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

    # Account emails (verify address, reset password). Leave SMTP_HOST empty to only log links.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    # Where the website lives; used to build links in emails.
    frontend_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("database_url")
    @classmethod
    def _portable_ssl_ca(cls, url: str) -> str:
        """Point ssl_ca at a CA bundle that exists on this machine.

        The Mac keeps it at /etc/ssl/cert.pem, Render at another path; if the
        given file is missing, use certifi's bundle so one URL works everywhere.
        """
        parts = urlsplit(url)
        query = dict(parse_qsl(parts.query))
        ca = query.get("ssl_ca")
        if ca and not os.path.exists(ca):
            import certifi

            query["ssl_ca"] = certifi.where()
            return urlunsplit(parts._replace(query=urlencode(query, safe="/:")))
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
