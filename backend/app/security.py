import datetime
import hashlib
import secrets

from fastapi import Depends, HTTPException, Request, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session as DBSession

from app.config import get_settings
from app.database import get_db
from app.models.user import Session as SessionModel
from app.models.user import User

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    return pwd_context.verify(password, password_hash)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: DBSession, user: User) -> str:
    """Create a session row and return the raw token to store in the client's cookie."""
    raw_token = secrets.token_urlsafe(48)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(
        minutes=settings.session_expire_minutes
    )
    session_row = SessionModel(
        user_id=user.id, token_hash=_hash_token(raw_token), expires_at=expires_at
    )
    db.add(session_row)
    db.commit()
    return raw_token


def revoke_session(db: DBSession, raw_token: str) -> None:
    token_hash = _hash_token(raw_token)
    db.query(SessionModel).filter(SessionModel.token_hash == token_hash).delete()
    db.commit()


def get_current_user(
    request: Request, db: DBSession = Depends(get_db)
) -> User:
    raw_token = request.cookies.get(settings.session_cookie_name)
    if not raw_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    token_hash = _hash_token(raw_token)
    session_row = (
        db.query(SessionModel).filter(SessionModel.token_hash == token_hash).first()
    )
    if not session_row or session_row.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired")

    user = db.get(User, session_row.user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account inactive")
    return user


def get_current_user_optional(
    request: Request, db: DBSession = Depends(get_db)
) -> User | None:
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


def require_role(*allowed_roles: str):
    """FastAPI dependency factory: require_role('admin') or require_role('admin', 'editor')."""

    def dependency(user: User = Depends(get_current_user)) -> User:
        if not any(user.has_role(r) for r in allowed_roles):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
        return user

    return dependency


EMAIL_NOT_VERIFIED = "Please confirm your email address first. Check your inbox for the link."


def get_verified_user(user: User = Depends(get_current_user)) -> User:
    """Signed in AND has confirmed their email (needed to post reviews and comments)."""
    if not user.email_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, EMAIL_NOT_VERIFIED)
    return user
