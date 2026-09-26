from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.destination import Destination
from app.models.news import NewsEvent
from app.models.review import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentOut
from app.security import get_current_user

router = APIRouter(prefix="/api/comments", tags=["comments"])


def _to_out(db: Session, comment: Comment) -> CommentOut:
    out = CommentOut.model_validate(comment)
    author = db.get(User, comment.user_id)
    if author:
        out.user_display_name = author.display_name
        out.user_avatar_url = author.avatar.url if author.avatar else None
    return out


@router.get("", response_model=list[CommentOut])
def list_comments(
    news_event_id: int | None = Query(default=None),
    destination_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if (news_event_id is None) == (destination_id is None):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Give exactly one of news_event_id or destination_id"
        )
    query = db.query(Comment)
    if news_event_id is not None:
        query = query.filter(Comment.news_event_id == news_event_id)
    else:
        query = query.filter(Comment.destination_id == destination_id)
    return [_to_out(db, c) for c in query.order_by(Comment.created_at.asc()).limit(500).all()]


@router.post("", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    payload: CommentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.news_event_id is not None:
        target = db.get(NewsEvent, payload.news_event_id)
    else:
        target = db.get(Destination, payload.destination_id)
    if not target or getattr(target, "status", "published") != "published":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")

    comment = Comment(
        news_event_id=payload.news_event_id,
        destination_id=payload.destination_id,
        user_id=user.id,
        body=payload.body,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _to_out(db, comment)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comment not found")
    if comment.user_id != user.id and not (user.has_role("admin") or user.has_role("editor")):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
    db.delete(comment)
    db.commit()
