"""Simple per-IP (and per-email) rate limits, kept in memory.

Render runs one server process, so a dictionary is enough. If the server
restarts the counters reset, which is fine for slowing down password guessing.
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

_lock = threading.Lock()
_hits: dict[str, deque] = defaultdict(deque)


def client_ip(request: Request) -> str:
    # The Cloudflare Worker sets X-Real-IP to the visitor's address.
    for header in ("x-real-ip", "cf-connecting-ip"):
        value = request.headers.get(header)
        if value:
            return value.strip()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def hit(key: str, limit: int, window: int) -> None:
    """Count one attempt for `key`; raise 429 once `limit` is passed within `window` seconds."""
    now = time.monotonic()
    with _lock:
        q = _hits[key]
        while q and q[0] <= now - window:
            q.popleft()
        if len(q) >= limit:
            retry = int(q[0] + window - now) + 1
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "Too many attempts. Please wait a few minutes and try again.",
                headers={"Retry-After": str(retry)},
            )
        q.append(now)
        # Keep memory small: drop empty keys now and then.
        if len(_hits) > 50_000:
            for k in [k for k, v in _hits.items() if not v]:
                del _hits[k]


def reset() -> None:
    """Clear all counters (used by tests)."""
    with _lock:
        _hits.clear()


def limit(name: str, times: int, seconds: int):
    """FastAPI dependency: at most `times` requests per `seconds` from one IP."""

    def dependency(request: Request) -> None:
        hit(f"{name}:{client_ip(request)}", times, seconds)

    return dependency
