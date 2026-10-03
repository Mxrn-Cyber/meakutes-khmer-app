import datetime

from pydantic import BaseModel

from app.schemas.media import MediaOut


class NewsEventBase(BaseModel):
    title: str
    title_km: str | None = None
    date_label: str | None = None
    event_date: datetime.date | None = None
    location: str | None = None
    description: str | None = None
    description_km: str | None = None
    best_time: str | None = None
    accessibility: str | None = None
    status: str = "draft"


class NewsEventCreate(NewsEventBase):
    media_id: int | None = None


class NewsEventUpdate(BaseModel):
    title: str | None = None
    title_km: str | None = None
    date_label: str | None = None
    event_date: datetime.date | None = None
    location: str | None = None
    description: str | None = None
    description_km: str | None = None
    best_time: str | None = None
    accessibility: str | None = None
    status: str | None = None
    media_id: int | None = None


class NewsEventOut(NewsEventBase):
    id: int
    slug: str
    created_at: datetime.datetime
    image: MediaOut | None = None

    model_config = {"from_attributes": True}
