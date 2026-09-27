from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Role, User
from app.schemas.user import AdminUserOut, SetActiveRequest, UpdateRolesRequest
from app.security import require_role

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


@router.get("", response_model=list[AdminUserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_role("admin"))):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [AdminUserOut.from_user(u) for u in users]


@router.put("/{user_id}/roles", response_model=AdminUserOut)
def set_roles(
    user_id: int,
    payload: UpdateRolesRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    target.roles = db.query(Role).filter(Role.name.in_(payload.roles)).all()
    db.commit()
    db.refresh(target)
    return AdminUserOut.from_user(target)


@router.put("/{user_id}/active", response_model=AdminUserOut)
def set_active(
    user_id: int,
    payload: SetActiveRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    target.is_active = payload.is_active
    db.commit()
    db.refresh(target)
    return AdminUserOut.from_user(target)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """Permanently delete an account and everything that belongs only to it.

    Removes the user's sessions, Google link, roles, favourites, reviews and
    comments. Places, news and images they created stay, without an author.
    """
    if user_id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot delete your own account")
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    from app import storage
    from app.models.destination import Destination
    from app.models.media import Media
    from app.models.news import NewsEvent
    from app.models.review import Comment, Favorite, Review, UserActivity
    from app.models.user import OAuthAccount
    from app.models.user import Session as SessionModel

    avatar = db.get(Media, target.avatar_media_id) if target.avatar_media_id else None
    target.avatar_media_id = None
    target.roles = []
    db.flush()

    for model in (SessionModel, OAuthAccount, Favorite, Review, Comment):
        db.query(model).filter(model.user_id == user_id).delete(synchronize_session=False)
    db.query(UserActivity).filter(UserActivity.user_id == user_id).update({"user_id": None}, synchronize_session=False)
    db.query(Media).filter(Media.uploaded_by == user_id).update({"uploaded_by": None}, synchronize_session=False)
    db.query(Destination).filter(Destination.created_by == user_id).update({"created_by": None}, synchronize_session=False)
    db.query(NewsEvent).filter(NewsEvent.created_by == user_id).update({"created_by": None}, synchronize_session=False)

    if avatar:
        storage.delete(avatar.url)
        db.delete(avatar)
    db.delete(target)
    db.commit()
