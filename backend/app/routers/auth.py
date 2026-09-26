import datetime
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.media import Media
from app.models.user import OAuthAccount, Role, User
from app.schemas.auth import (
    ChangePasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    UserOut,
)
from app.models.user import Session as SessionModel
from app.security import (
    _hash_token,
    create_session,
    get_current_user,
    hash_password,
    revoke_session,
    verify_password,
)

AVATAR_ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}
AVATAR_MAX_BYTES = 4 * 1024 * 1024

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.session_expire_minutes * 60,
        path="/",
    )


def _default_role(db: Session) -> Role | None:
    return db.query(Role).filter(Role.name == "user").first()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        display_name=f"{payload.first_name} {payload.last_name}".strip(),
    )
    role = _default_role(db)
    if role:
        user.roles.append(role)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_session(db, user)
    _set_session_cookie(response, token)
    return UserOut.from_user(user)


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated")

    token = create_session(db, user)
    _set_session_cookie(response, token)
    return UserOut.from_user(user)


@router.post("/google", response_model=UserOut)
def google_login(payload: GoogleLoginRequest, response: Response, db: Session = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Google login is not configured")

    try:
        claims = google_id_token.verify_oauth2_token(
            payload.id_token, google_requests.Request(), settings.google_client_id
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google token") from exc

    google_sub = claims["sub"]
    email = claims.get("email")

    oauth_account = (
        db.query(OAuthAccount)
        .filter(OAuthAccount.provider == "google", OAuthAccount.provider_user_id == google_sub)
        .first()
    )

    if oauth_account:
        user = db.get(User, oauth_account.user_id)
    else:
        user = db.query(User).filter(User.email == email).first() if email else None
        if not user:
            user = User(
                email=email,
                display_name=claims.get("name"),
                first_name=claims.get("given_name"),
                last_name=claims.get("family_name"),
            )
            role = _default_role(db)
            if role:
                user.roles.append(role)
            db.add(user)
            db.flush()
        db.add(OAuthAccount(user_id=user.id, provider="google", provider_user_id=google_sub, email=email))
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated")

    token = create_session(db, user)
    _set_session_cookie(response, token)
    return UserOut.from_user(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(settings.session_cookie_name)
    if raw_token:
        revoke_session(db, raw_token)
    response.delete_cookie(
        settings.session_cookie_name,
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.from_user(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field in ("first_name", "last_name", "phone"):
        value = getattr(payload, field)
        if value is not None:
            setattr(user, field, value)
    if payload.first_name or payload.last_name:
        user.display_name = f"{user.first_name or ''} {user.last_name or ''}".strip()

    new_email = (payload.email or "").strip().lower()
    if new_email and new_email != (user.email or "").lower():
        # Changing the address that signs you in, so prove you own the session.
        if not user.password_hash:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This account signs in with Google. Ask an admin to change its email address.",
            )
        if not payload.current_password:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Enter your current password to change your email"
            )
        if not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password is incorrect")
        if db.query(User).filter(User.email == new_email, User.id != user.id).first():
            raise HTTPException(status.HTTP_409_CONFLICT, "That email is already in use")
        user.email = new_email

    db.commit()
    db.refresh(user)
    return UserOut.from_user(user)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.password_hash:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "This account signs in with Google and has no password to change.",
        )
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password is incorrect")
    if verify_password(payload.new_password, user.password_hash):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "The new password must differ from the current one"
        )

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    # Sign every other device out; keep this one signed in.
    current_token = request.cookies.get(settings.session_cookie_name)
    current_hash = _hash_token(current_token) if current_token else None
    query = db.query(SessionModel).filter(SessionModel.user_id == user.id)
    if current_hash:
        query = query.filter(SessionModel.token_hash != current_hash)
    query.delete(synchronize_session=False)
    db.commit()


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Any signed-in user can set their own profile photo.

    Deliberately separate from /api/media (admin/editor only) so avatars stay
    out of the admin image library.
    """
    if file.content_type not in AVATAR_ALLOWED_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported image type")

    contents = await file.read()
    if len(contents) > AVATAR_MAX_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image too large (max 4MB)")

    avatar_root = Path(settings.media_root) / "avatars"
    avatar_root.mkdir(parents=True, exist_ok=True)
    extension = Path(file.filename or "").suffix.lower() or ".bin"
    filename = f"{uuid.uuid4().hex}{extension}"
    (avatar_root / filename).write_bytes(contents)

    media = Media(
        url=f"{settings.media_url_prefix}/avatars/{filename}",
        alt_text=f"Profile photo for {user.display_name or user.email}",
        uploaded_by=user.id,
    )
    db.add(media)
    db.flush()

    previous_id = user.avatar_media_id
    user.avatar_media_id = media.id
    db.commit()

    # Drop the file the old avatar pointed at, so uploads do not pile up.
    if previous_id and previous_id != media.id:
        old = db.get(Media, previous_id)
        if old:
            old_path = Path(settings.media_root) / old.url.split(
                f"{settings.media_url_prefix}/", 1
            )[-1]
            old_path.unlink(missing_ok=True)
            db.delete(old)
            db.commit()

    db.refresh(user)
    return UserOut.from_user(user)
