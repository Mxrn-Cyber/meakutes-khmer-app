"""Where uploaded images are kept.

STORAGE_BACKEND=local  -> files in MEDIA_ROOT, served by the API at MEDIA_URL_PREFIX (development)
STORAGE_BACKEND=r2     -> files in a Cloudflare R2 bucket, served from R2_PUBLIC_URL (production)

Render's free plan wipes its disk on every deploy, so production must use R2.
"""

from functools import lru_cache
from pathlib import Path

from app.config import get_settings

settings = get_settings()


@lru_cache
def _r2_client():
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=Config(signature_version="s3v4", retries={"max_attempts": 3}),
    )


def _use_r2() -> bool:
    return settings.storage_backend.lower() == "r2"


def save(key: str, data: bytes, content_type: str | None = None) -> str:
    """Store `data` under `key` (e.g. "avatars/ab12.png") and return its public URL."""
    key = key.lstrip("/")
    if _use_r2():
        extra = {"ContentType": content_type} if content_type else {}
        _r2_client().put_object(
            Bucket=settings.r2_bucket,
            Key=key,
            Body=data,
            CacheControl="public, max-age=31536000, immutable",
            **extra,
        )
        return f"{settings.r2_public_url.rstrip('/')}/{key}"

    path = Path(settings.media_root) / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return f"{settings.media_url_prefix}/{key}"


def delete(url: str | None) -> None:
    """Remove a stored file by the URL `save` returned. Unknown URLs are ignored."""
    if not url:
        return
    local_prefix = f"{settings.media_url_prefix}/"
    r2_prefix = f"{settings.r2_public_url.rstrip('/')}/" if settings.r2_public_url else None

    if r2_prefix and url.startswith(r2_prefix):
        _r2_client().delete_object(Bucket=settings.r2_bucket, Key=url[len(r2_prefix):])
    elif url.startswith(local_prefix):
        (Path(settings.media_root) / url[len(local_prefix):]).unlink(missing_ok=True)


def read(url: str) -> bytes:
    """Return the bytes of a file stored with `save` (used to edit an existing image)."""
    local_prefix = f"{settings.media_url_prefix}/"
    r2_prefix = f"{settings.r2_public_url.rstrip('/')}/" if settings.r2_public_url else None

    if r2_prefix and url.startswith(r2_prefix):
        obj = _r2_client().get_object(Bucket=settings.r2_bucket, Key=url[len(r2_prefix):])
        return obj["Body"].read()
    if url.startswith(local_prefix):
        return (Path(settings.media_root) / url[len(local_prefix):]).read_bytes()
    if url.startswith(("http://", "https://")):
        import requests

        response = requests.get(url, timeout=20)
        response.raise_for_status()
        return response.content
    raise FileNotFoundError(url)
