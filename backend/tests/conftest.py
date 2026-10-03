"""Test setup: a throwaway SQLite database built from the models.

The Alembic migrations are checked separately in CI against MySQL.
"""
import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["MEDIA_ROOT"] = f"{_tmp}/media"
os.environ["STORAGE_BACKEND"] = "local"
os.environ["SMTP_HOST"] = "smtp.test"  # pretend email is set up; sending is captured below
os.environ["SMTP_FROM"] = "test@example.com"
os.environ["FRONTEND_URL"] = "https://site.test"

import pytest  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def database():
    import app.models  # noqa: F401
    from app.database import Base, engine

    Base.metadata.create_all(engine)
    yield


@pytest.fixture()
def outbox(monkeypatch):
    """Collects emails instead of sending them."""
    from app import mailer

    sent = []
    monkeypatch.setattr(mailer, "send", lambda to, subject, text, html=None: sent.append((to, subject, text)))
    return sent


@pytest.fixture()
def client(database):
    from fastapi.testclient import TestClient

    from app import ratelimit
    from app.main import app

    ratelimit.reset()
    with TestClient(app) as c:
        yield c
