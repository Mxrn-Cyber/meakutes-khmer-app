import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SiteImage(Base):
    """A photo slot on the public site (home slides, page banners...) chosen by an admin.

    Slots with no row here show the built-in default photo.
    """

    __tablename__ = "site_images"

    key: Mapped[str] = mapped_column(String(60), primary_key=True)
    media_id: Mapped[int | None] = mapped_column(ForeignKey("media.id", ondelete="SET NULL"), nullable=True)
    caption: Mapped[str | None] = mapped_column(String(255), nullable=True)
    caption_km: Mapped[str | None] = mapped_column(String(255), nullable=True)
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    media: Mapped["Media | None"] = relationship("Media", lazy="joined")  # noqa: F821
