import io
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app import storage
from app.config import get_settings
from app.database import get_db
from app.models.media import Media
from app.models.site_image import SiteImage
from app.models.user import User
from app.schemas.media import MediaOut
from app.security import require_role

router = APIRouter(prefix="/api/media", tags=["media"])
settings = get_settings()

ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}
MAX_BYTES = 8 * 1024 * 1024


@router.get("", response_model=list[MediaOut])
def list_media(db: Session = Depends(get_db), _: User = Depends(require_role("admin", "editor"))):
    return db.query(Media).order_by(Media.created_at.desc()).all()


@router.post("", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor")),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported image type")

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image too large (max 8MB)")

    extension = Path(file.filename or "").suffix.lower() or ".bin"
    url = storage.save(f"uploads/{uuid.uuid4().hex}{extension}", contents, file.content_type)

    media = Media(url=url, uploaded_by=user.id)
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Media not found")
    storage.delete(media.url)
    # Site photo slots using this image go back to their default photo.
    db.query(SiteImage).filter(SiteImage.media_id == media.id).delete(synchronize_session=False)
    db.delete(media)
    db.commit()


class CropIn(BaseModel):
    """A rectangle in the original image's pixels, plus optional rotation and size limit."""

    x: int = Field(ge=0)
    y: int = Field(ge=0)
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    rotation: int = 0  # 0, 90, 180 or 270, applied before cropping
    max_width: int = Field(default=1920, ge=200, le=4000)


@router.post("/{media_id}/crop", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
def crop_media(
    media_id: int,
    payload: CropIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor")),
):
    """Save a cropped, resized copy of an image as a new Media item. The original is kept."""
    from PIL import Image, ImageOps

    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Media not found")
    if payload.rotation not in (0, 90, 180, 270):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Rotation must be 0, 90, 180 or 270")
    try:
        original = Image.open(io.BytesIO(storage.read(media.url)))
        image = ImageOps.exif_transpose(original)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Could not open this image")

    if payload.rotation:
        image = image.rotate(-payload.rotation, expand=True)  # PIL rotates counter-clockwise
    box = (payload.x, payload.y, payload.x + payload.width, payload.y + payload.height)
    if box[2] > image.width or box[3] > image.height:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The crop is outside the image")
    image = image.crop(box)
    if image.width > payload.max_width:
        image = image.resize(
            (payload.max_width, round(image.height * payload.max_width / image.width)), Image.LANCZOS
        )

    has_alpha = image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info)
    image = image.convert("RGBA" if has_alpha else "RGB")
    out = io.BytesIO()
    image.save(out, format="WEBP", quality=85, method=4)

    url = storage.save(f"uploads/{uuid.uuid4().hex}.webp", out.getvalue(), "image/webp")
    cropped = Media(url=url, alt_text=media.alt_text, uploaded_by=user.id)
    db.add(cropped)
    db.commit()
    db.refresh(cropped)
    return cropped
