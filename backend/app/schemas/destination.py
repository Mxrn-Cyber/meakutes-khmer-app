import datetime

from pydantic import BaseModel

from app.schemas.media import MediaOut


class TaxonomyOut(BaseModel):
    id: int
    name: str
    name_km: str | None = None
    slug: str

    model_config = {"from_attributes": True}


class TaxonomyCreate(BaseModel):
    name: str
    name_km: str | None = None


class DestinationBase(BaseModel):
    name: str
    name_km: str | None = None
    province: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    duration: str | None = None
    access: str | None = None
    accessibility: str | None = None
    best_time: str | None = None
    description: str | None = None
    description_km: str | None = None
    article: str | None = None
    article_km: str | None = None
    status: str = "draft"


class DestinationCreate(DestinationBase):
    category_ids: list[int] = []
    tag_ids: list[int] = []
    media_ids: list[int] = []  # in display order


class DestinationUpdate(BaseModel):
    name: str | None = None
    name_km: str | None = None
    province: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    duration: str | None = None
    access: str | None = None
    accessibility: str | None = None
    best_time: str | None = None
    description: str | None = None
    description_km: str | None = None
    article: str | None = None
    article_km: str | None = None
    status: str | None = None
    category_ids: list[int] | None = None
    tag_ids: list[int] | None = None
    media_ids: list[int] | None = None


class DestinationOut(DestinationBase):
    id: int
    slug: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    categories: list[TaxonomyOut] = []
    tags: list[TaxonomyOut] = []
    images: list[MediaOut] = []
    rating: float = 0.0
    reviews_count: int = 0

    model_config = {"from_attributes": True}
