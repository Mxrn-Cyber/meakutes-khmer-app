import re
import uuid


def _email():
    return f"t{uuid.uuid4().hex[:10]}@example.com"


def _link_token(outbox):
    text = outbox[-1][2]
    return re.search(r"token=([\w-]+)", text).group(1)


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_public_lists(client):
    for path in ("/api/destinations", "/api/news", "/api/site-images", "/api/stats"):
        r = client.get(path)
        assert r.status_code == 200, path


def test_register_needs_email_confirmation(client, outbox):
    email = _email()
    r = client.post(
        "/auth/register",
        json={"email": email, "password": "Travel2026", "first_name": "Test", "last_name": "User"},
    )
    assert r.status_code == 201
    assert r.json()["email_verified"] is False
    assert outbox and outbox[-1][0] == email

    # Unconfirmed users cannot post.
    r = client.post("/api/comments", json={"destination_id": 1, "body": "Hello"})
    assert r.status_code == 403 and r.json()["detail"].startswith("Please confirm your email")

    token = _link_token(outbox)
    r = client.post("/auth/verify-email", json={"token": token})
    assert r.status_code == 200 and r.json()["email_verified"] is True
    # A link works only once.
    assert client.post("/auth/verify-email", json={"token": token}).status_code == 400


def test_forgot_and_reset_password(client, outbox):
    email = _email()
    client.post(
        "/auth/register",
        json={"email": email, "password": "Travel2026", "first_name": "A", "last_name": "B"},
    )
    client.post("/auth/logout")

    # Unknown emails get the same answer.
    assert client.post("/auth/forgot-password", json={"email": _email()}).status_code == 204
    before = len(outbox)
    assert client.post("/auth/forgot-password", json={"email": email}).status_code == 204
    assert len(outbox) == before + 1

    token = _link_token(outbox)
    assert client.post("/auth/reset-password", json={"token": token, "password": "short"}).status_code == 422
    assert client.post("/auth/reset-password", json={"token": token, "password": "NewTravel2026"}).status_code == 204
    assert client.post("/auth/login", json={"email": email, "password": "Travel2026"}).status_code == 401
    r = client.post("/auth/login", json={"email": email, "password": "NewTravel2026"})
    assert r.status_code == 200 and r.json()["email_verified"] is True


def test_login_rate_limit(client):
    email = _email()
    codes = [
        client.post("/auth/login", json={"email": email, "password": "wrong-password"}).status_code
        for _ in range(11)
    ]
    assert codes[:10] == [401] * 10
    assert codes[10] == 429
