from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import SessionLocal
from app.models.user import Role
from app.routers import auth, comments, destinations, favorites, media, news, reviews, users
from app.routers.taxonomy import categories_router, tags_router

settings = get_settings()

app = FastAPI(title="Meakutes-Khmer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path(settings.media_root).mkdir(parents=True, exist_ok=True)
app.mount(settings.media_url_prefix, StaticFiles(directory=settings.media_root), name="media")

app.include_router(auth.router)
app.include_router(destinations.router)
app.include_router(categories_router)
app.include_router(tags_router)
app.include_router(news.router)
app.include_router(media.router)
app.include_router(reviews.router)
app.include_router(comments.router)
app.include_router(favorites.router)
app.include_router(users.router)


@app.on_event("startup")
def ensure_default_roles() -> None:
    db = SessionLocal()
    try:
        existing = {r.name for r in db.query(Role).all()}
        for name in ("admin", "editor", "user"):
            if name not in existing:
                db.add(Role(name=name))
        db.commit()
    finally:
        db.close()


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
def health():
    return {"status": "ok"}
