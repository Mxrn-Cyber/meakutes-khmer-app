import datetime
import secrets
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Request, Response, UploadFile, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app import mailer, storage
from app.config import get_settings
from app.database import get_db
from app.models.media import Media
from app.models.user import OAuthAccount, Role, User, UserToken
from app.ratelimit import client_ip, hit, limit
from app.schemas.auth import (
    ChangePasswordRequest,
    EmailRequest,
    ResetPasswordRequest,
    TokenRequest,
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


VERIFY_HOURS = 48
RESET_HOURS = 1


def _new_link(db: Session, user: User, purpose: str, hours: int, page: str) -> str:
    """Create a one-time token and return the website link that carries it."""
    # Older unused links of the same kind stop working.
    db.query(UserToken).filter(
        UserToken.user_id == user.id, UserToken.purpose == purpose, UserToken.used_at.is_(None)
    ).delete(synchronize_session=False)
    raw = secrets.token_urlsafe(32)
    db.add(
        UserToken(
            user_id=user.id,
            purpose=purpose,
            token_hash=_hash_token(raw),
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=hours),
        )
    )
    db.commit()
    return f"{settings.frontend_url.rstrip('/')}/{page}?token={raw}"


def _use_token(db: Session, raw: str, purpose: str) -> UserToken:
    row = (
        db.query(UserToken)
        .filter(UserToken.token_hash == _hash_token(raw), UserToken.purpose == purpose)
        .first()
    )
    if not row or row.used_at or row.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This link is invalid or has expired")
    row.used_at = datetime.datetime.utcnow()
    return row


def _send_verification(db: Session, user: User, background: BackgroundTasks) -> None:
    link = _new_link(db, user, "verify", VERIFY_HOURS, "verify-email")
    background.add_task(mailer.send_verification, user.email, link)


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(limit("register", 5, 3600))],
)
def register(
    payload: RegisterRequest,
    response: Response,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        display_name=f"{payload.first_name} {payload.last_name}".strip(),
        # Without email set up there is no way to confirm, so trust the address.
        email_verified=not mailer.is_configured(),
    )
    role = _default_role(db)
    if role:
        user.roles.append(role)
    db.add(user)
    db.commit()
    db.refresh(user)
    if not user.email_verified:
        _send_verification(db, user, background)

    token = create_session(db, user)
    _set_session_cookie(response, token)
    return UserOut.from_user(user)


@router.post("/login", response_model=UserOut)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    # 10 tries per 5 minutes from one IP, and 10 per 15 minutes against one account.
    hit(f"login-ip:{client_ip(request)}", 10, 300)
    hit(f"login-email:{payload.email.lower()}", 10, 900)
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated")

    token = create_session(db, user)
    _set_session_cookie(response, token)
    return UserOut.from_user(user)


@router.post("/google", response_model=UserOut, dependencies=[Depends(limit("google", 20, 300))])
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
    email = (claims.get("email") or "").lower() or None
    if email and not claims.get("email_verified"):
        # Never link to an existing account through an address Google has not verified.
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Your Google email address is not verified")

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
                email_verified=True,  # Google already checked this address
                display_name=claims.get("name"),
                first_name=claims.get("given_name"),
                last_name=claims.get("family_name"),
            )
            role = _default_role(db)
            if role:
                user.roles.append(role)
            db.add(user)
            db.flush()
        user.email_verified = True
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
    background: BackgroundTasks,
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
        if mailer.is_configured():
            user.email_verified = False
            db.commit()
            _send_verification(db, user, background)

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

    extension = Path(file.filename or "").suffix.lower() or ".bin"
    url = storage.save(f"avatars/{uuid.uuid4().hex}{extension}", contents, file.content_type)

    media = Media(
        url=url,
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
            storage.delete(old.url)
            db.delete(old)
            db.commit()

    db.refresh(user)
    return UserOut.from_user(user)


@router.post(
    "/forgot-password",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(limit("forgot", 5, 3600))],
)
def forgot_password(payload: EmailRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    """Always answers the same way, so nobody can test which emails have accounts."""
    email = payload.email.lower()
    hit(f"forgot-email:{email}", 3, 3600)
    user = db.query(User).filter(User.email == email).first()
    if user and user.is_active:
        link = _new_link(db, user, "reset", RESET_HOURS, "reset-password")
        background.add_task(mailer.send_password_reset, user.email, link)


@router.post(
    "/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(limit("reset", 10, 3600))],
)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    row = _use_token(db, payload.token, "reset")
    user = db.get(User, row.user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This link is invalid or has expired")
    user.password_hash = hash_password(payload.password)
    user.email_verified = True  # they opened the email, so the address works
    # Sign out everywhere; the person signs in again with the new password.
    db.query(SessionModel).filter(SessionModel.user_id == user.id).delete(synchronize_session=False)
    db.commit()


@router.post("/verify-email", response_model=UserOut, dependencies=[Depends(limit("verify", 20, 3600))])
def verify_email(payload: TokenRequest, db: Session = Depends(get_db)):
    row = _use_token(db, payload.token, "verify")
    user = db.get(User, row.user_id)
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This link is invalid or has expired")
    user.email_verified = True
    db.commit()
    db.refresh(user)
    return UserOut.from_user(user)


@router.post(
    "/resend-verification",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(limit("resend", 5, 3600))],
)
def resend_verification(
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.email_verified:
        return
    hit(f"resend-user:{user.id}", 3, 3600)
    _send_verification(db, user, background)
