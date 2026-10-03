from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.ratelimit import limit
from app.models.destination import Destination
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut
from app.security import get_current_user, get_current_user_optional, require_role, get_verified_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


def _to_out(review: Review) -> ReviewOut:
    out = ReviewOut.model_validate(review)
    out.user_display_name = review.user.display_name if review.user else None
    return out


@router.get("", response_model=list[ReviewOut])
def list_reviews(
    destination_id: int | None = Query(default=None),
    status_filter: str | None = Query(default="published", alias="status"),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    query = db.query(Review)
    if destination_id is not None:
        query = query.filter(Review.destination_id == destination_id)
    else:
        # Listing across every destination is a moderation view — restrict it.
        if not (user and (user.has_role("admin") or user.has_role("editor"))):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
    if status_filter and status_filter != "all":
        query = query.filter(Review.status == status_filter)
    reviews = query.order_by(Review.created_at.desc()).all()
    return [_to_out(r) for r in reviews]


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(limit("reviews", 20, 3600))])
def create_or_update_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    if not db.get(Destination, payload.destination_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Destination not found")

    existing = (
        db.query(Review)
        .filter(Review.destination_id == payload.destination_id, Review.user_id == user.id)
        .first()
    )
    if existing:
        if existing.status == "removed":
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "Your review for this place was removed by a moderator"
            )
        existing.rating = payload.rating
        # A star click from a card sends only a rating; keep the written text.
        if "comment" in payload.model_fields_set:
            existing.comment = payload.comment
        # Keep "flagged" as it is so moderators still see it.
        review = existing
    else:
        review = Review(
            destination_id=payload.destination_id,
            user_id=user.id,
            rating=payload.rating,
            comment=payload.comment,
        )
        db.add(review)
    db.commit()
    db.refresh(review)
    return _to_out(review)


@router.patch("/{review_id}/moderate", response_model=ReviewOut)
def moderate_review(
    review_id: int,
    new_status: str = Query(..., pattern="^(published|flagged|removed)$"),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),
):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
    review.status = new_status
    db.commit()
    db.refresh(review)
    return _to_out(review)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
    if review.user_id != user.id and not (user.has_role("admin") or user.has_role("editor")):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
    db.delete(review)
    db.commit()
