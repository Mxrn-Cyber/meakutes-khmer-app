"""Categories and tags share the exact same shape, so both routers are built from one factory."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.destination import Category, Tag
from app.models.user import User
from app.schemas.destination import TaxonomyCreate, TaxonomyOut
from app.security import require_role
from app.utils.slugify import unique_slug


def build_taxonomy_router(model, prefix: str, tag: str) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("", response_model=list[TaxonomyOut])
    def list_all(db: Session = Depends(get_db)):
        return db.query(model).order_by(model.name).all()

    @router.post("", response_model=TaxonomyOut, status_code=status.HTTP_201_CREATED)
    def create(
        payload: TaxonomyCreate,
        db: Session = Depends(get_db),
        _: User = Depends(require_role("admin", "editor")),
    ):
        row = model(name=payload.name, name_km=(payload.name_km or None), slug=unique_slug(db, model, payload.name))
        db.add(row)
        db.commit()
        db.refresh(row)
        return row

    @router.put("/{item_id}", response_model=TaxonomyOut)
    def rename(
        item_id: int,
        payload: TaxonomyCreate,
        db: Session = Depends(get_db),
        _: User = Depends(require_role("admin", "editor")),
    ):
        row = db.get(model, item_id)
        if not row:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"{tag[:-1].title()} not found")
        row.name = payload.name
        if "name_km" in payload.model_fields_set:  # older clients send only the name
            row.name_km = payload.name_km or None
        row.slug = unique_slug(db, model, payload.name, exclude_id=item_id)
        db.commit()
        db.refresh(row)
        return row

    @router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete(
        item_id: int,
        db: Session = Depends(get_db),
        _: User = Depends(require_role("admin")),
    ):
        row = db.get(model, item_id)
        if not row:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"{tag[:-1].title()} not found")
        db.delete(row)
        db.commit()

    return router


categories_router = build_taxonomy_router(Category, "/api/categories", "categories")
tags_router = build_taxonomy_router(Tag, "/api/tags", "tags")
