from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.destination import Category, Destination, DestinationMedia, Tag
from app.models.media import Media
from app.models.review import Review
from app.models.user import User
from app.schemas.destination import DestinationCreate, DestinationOut, DestinationUpdate
from app.security import get_current_user, get_current_user_optional, require_role
from app.utils.slugify import unique_slug

def _is_staff(user: User | None) -> bool:
    return bool(user and (user.has_role("admin") or user.has_role("editor")))


router = APIRouter(prefix="/api/destinations", tags=["destinations"])


def _rating_stats(db: Session, destination_id: int) -> tuple[float, int]:
    row = (
        db.query(func.avg(Review.rating), func.count(Review.id))
        .filter(Review.destination_id == destination_id, Review.status == "published")
        .one()
    )
    avg, count = row
    return (round(float(avg), 1) if avg else 0.0, count or 0)


def _to_out(db: Session, destination: Destination) -> DestinationOut:
    rating, count = _rating_stats(db, destination.id)
    out = DestinationOut.model_validate(destination)
    out.images = [link.media for link in destination.media_links]
    out.rating = rating
    out.reviews_count = count
    return out


def _apply_taxonomy_and_media(db: Session, destination: Destination, payload) -> None:
    if payload.category_ids is not None:
        destination.categories = (
            db.query(Category).filter(Category.id.in_(payload.category_ids)).all()
            if payload.category_ids
            else []
        )
    if payload.tag_ids is not None:
        destination.tags = (
            db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all() if payload.tag_ids else []
        )
    if payload.media_ids is not None:
        destination.media_links.clear()
        for order, media_id in enumerate(payload.media_ids):
            destination.media_links.append(DestinationMedia(media_id=media_id, sort_order=order))


@router.get("", response_model=list[DestinationOut])
def list_destinations(
    province: str | None = None,
    category: str | None = None,
    q: str | None = Query(default=None, description="Search text over name/description"),
    status_filter: str | None = Query(default="published", alias="status"),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    if not _is_staff(user):
        status_filter = "published"  # drafts are for the admin panel only
    query = db.query(Destination)
    if status_filter and status_filter != "all":
        query = query.filter(Destination.status == status_filter)
    if province:
        query = query.filter(Destination.province == province)
    if category:
        query = query.join(Destination.categories).filter(Category.slug == category)
    if q:
        like = f"%{q}%"
        query = query.filter(Destination.name.ilike(like) | Destination.description.ilike(like))
    destinations = query.order_by(Destination.created_at.desc()).all()
    return [_to_out(db, d) for d in destinations]


@router.get("/{slug_or_id}", response_model=DestinationOut)
def get_destination(
    slug_or_id: str,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    """Accepts either the slug ("angkor-wat") or the numeric id (for old /trip/:id links)."""
    query = db.query(Destination)
    destination = (
        query.filter(Destination.id == int(slug_or_id)).first()
        if slug_or_id.isdigit()
        else query.filter(Destination.slug == slug_or_id).first()
    )
    if not destination or (destination.status != "published" and not _is_staff(user)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Destination not found")
    return _to_out(db, destination)


@router.post("", response_model=DestinationOut, status_code=status.HTTP_201_CREATED)
def create_destination(
    payload: DestinationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor")),
):
    destination = Destination(
        **payload.model_dump(exclude={"category_ids", "tag_ids", "media_ids"}),
        created_by=user.id,
    )
    destination.slug = unique_slug(db, Destination, payload.name)
    db.add(destination)
    db.flush()
    _apply_taxonomy_and_media(db, destination, payload)
    db.commit()
    db.refresh(destination)
    return _to_out(db, destination)


@router.put("/{destination_id}", response_model=DestinationOut)
def update_destination(
    destination_id: int,
    payload: DestinationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),
):
    destination = db.get(Destination, destination_id)
    if not destination:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Destination not found")

    data = payload.model_dump(exclude={"category_ids", "tag_ids", "media_ids"}, exclude_unset=True)
    for field, value in data.items():
        setattr(destination, field, value)
    if "name" in data:
        destination.slug = unique_slug(db, Destination, data["name"], exclude_id=destination.id)

    _apply_taxonomy_and_media(db, destination, payload)
    db.commit()
    db.refresh(destination)
    return _to_out(db, destination)


@router.delete("/{destination_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_destination(
    destination_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    destination = db.get(Destination, destination_id)
    if not destination:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Destination not found")
    db.delete(destination)
    db.commit()
