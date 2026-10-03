"""Photos on the public site that admins can replace (Admin > Site photos)."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.media import Media
from app.models.site_image import SiteImage
from app.models.user import User
from app.security import require_role

router = APIRouter(prefix="/api/site-images", tags=["site images"])

# Must match the slots in frontend/src/siteImages.js.
SLOTS = {
    "home_slide_1",
    "home_slide_2",
    "home_slide_3",
    "home_slide_4",
    "home_slide_5",
    "home_story",
    "discover_banner",
    "popular_banner",
    "news_banner",
    "about_banner",
    "about_photo",
    "login_photo",
    "signup_photo",
    "team_1",
    "team_2",
}


class SiteImageIn(BaseModel):
    media_id: int
    caption: str | None = Field(default=None, max_length=255)
    caption_km: str | None = Field(default=None, max_length=255)


class SiteImageOut(BaseModel):
    key: str
    media_id: int | None
    url: str | None
    caption: str | None
    caption_km: str | None


def _out(row: SiteImage) -> SiteImageOut:
    return SiteImageOut(
        key=row.key,
        media_id=row.media_id,
        url=row.media.url if row.media else None,
        caption=row.caption,
        caption_km=row.caption_km,
    )


def _check_key(key: str) -> None:
    if key not in SLOTS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown photo slot")


@router.get("", response_model=dict[str, SiteImageOut])
def list_site_images(response: Response, db: Session = Depends(get_db)):
    """Public: only the slots an admin has changed. The site uses its defaults for the rest."""
    # Small response; always check, so admin changes show up straight away.
    response.headers["Cache-Control"] = "no-cache"
    rows = db.query(SiteImage).filter(SiteImage.media_id.isnot(None)).all()
    return {row.key: _out(row) for row in rows if row.key in SLOTS and row.media}


@router.put("/{key}", response_model=SiteImageOut)
def set_site_image(
    key: str,
    payload: SiteImageIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor")),
):
    _check_key(key)
    if not db.get(Media, payload.media_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Media not found")
    row = db.get(SiteImage, key) or SiteImage(key=key)
    row.media_id = payload.media_id
    row.caption = (payload.caption or "").strip() or None
    row.caption_km = (payload.caption_km or "").strip() or None
    row.updated_by = user.id
    db.add(row)
    db.commit()
    db.refresh(row)
    return _out(row)


@router.delete("/{key}", status_code=status.HTTP_204_NO_CONTENT)
def reset_site_image(
    key: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),
):
    """Go back to the built-in default photo."""
    _check_key(key)
    row = db.get(SiteImage, key)
    if row:
        db.delete(row)
        db.commit()
