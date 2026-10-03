import datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NewsEvent(Base):
    __tablename__ = "news_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    title_km: Mapped[str | None] = mapped_column(String(255), nullable=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    # Human-readable date/range as shown on the site (e.g. "April 13 - April 16")
    date_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # Optional real date, used for sorting "upcoming" events
    event_date: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_km: Mapped[str | None] = mapped_column(Text, nullable=True)
    best_time: Mapped[str | None] = mapped_column(String(120), nullable=True)
    accessibility: Mapped[str | None] = mapped_column(String(60), nullable=True)
    media_id: Mapped[int | None] = mapped_column(ForeignKey("media.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | published
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())

    image: Mapped["Media | None"] = relationship("Media", lazy="joined")  # noqa: F821
