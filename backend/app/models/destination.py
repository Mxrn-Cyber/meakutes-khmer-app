import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Destination(Base):
    __tablename__ = "destinations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    name_km: Mapped[str | None] = mapped_column(String(255), nullable=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    province: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration: Mapped[str | None] = mapped_column(String(60), nullable=True)
    access: Mapped[str | None] = mapped_column(String(60), nullable=True)
    accessibility: Mapped[str | None] = mapped_column(String(60), nullable=True)
    best_time: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_km: Mapped[str | None] = mapped_column(Text, nullable=True)
    article: Mapped[str | None] = mapped_column(Text, nullable=True)
    article_km: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | published
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    categories: Mapped[list["Category"]] = relationship(
        secondary="destination_categories", lazy="selectin"
    )
    tags: Mapped[list["Tag"]] = relationship(secondary="destination_tags", lazy="selectin")
    media_links: Mapped[list["DestinationMedia"]] = relationship(
        back_populates="destination",
        order_by="DestinationMedia.sort_order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    name_km: Mapped[str | None] = mapped_column(String(120), nullable=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    name_km: Mapped[str | None] = mapped_column(String(120), nullable=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)


class DestinationCategory(Base):
    __tablename__ = "destination_categories"

    destination_id: Mapped[int] = mapped_column(ForeignKey("destinations.id"), primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), primary_key=True)


class DestinationTag(Base):
    __tablename__ = "destination_tags"

    destination_id: Mapped[int] = mapped_column(ForeignKey("destinations.id"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id"), primary_key=True)


class DestinationMedia(Base):
    __tablename__ = "destination_media"

    destination_id: Mapped[int] = mapped_column(ForeignKey("destinations.id"), primary_key=True)
    media_id: Mapped[int] = mapped_column(ForeignKey("media.id"), primary_key=True)
    sort_order: Mapped[int] = mapped_column(default=0)

    destination: Mapped["Destination"] = relationship(back_populates="media_links")
    media: Mapped["Media"] = relationship(lazy="joined")
