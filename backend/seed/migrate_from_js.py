"""
One-off migration: load the old hardcoded tripsData.js / newsEvents.js content into MySQL.

Step 1 (Node, once per file) turns the JS module into JSON:
    node seed/convert_js_to_json.mjs path/to/tripsData.js default seed/tripsData.json
    node seed/convert_js_to_json.mjs path/to/newsEvents.js newsEvents seed/newsEvents.json

Step 2 (this script) loads the JSON into the database defined by DATABASE_URL / .env:
    python seed/migrate_from_js.py --trips seed/tripsData.json --news seed/newsEvents.json \
        --images-dir path/to/frontend/public

--images-dir should point at the old frontend's `public/` folder (or wherever
`/Trip-Image/...` and the news `pic` files actually live on disk) so referenced
images get copied into MEDIA_ROOT and registered as `media` rows. Omit it to
skip image migration and link destinations/news with no images.
"""

import argparse
import mimetypes
import uuid
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import storage  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.destination import Destination, DestinationMedia  # noqa: E402
from app.models.media import Media  # noqa: E402
from app.models.news import NewsEvent  # noqa: E402
from app.utils.slugify import unique_slug  # noqa: E402

settings = get_settings()


def copy_image(db, images_dir: Path | None, relative_path: str | None) -> Media | None:
    if not relative_path:
        return None
    if not images_dir:
        # No local source available - keep the old path as a reference so it's not lost,
        # even though nothing is actually served from it until re-uploaded via the admin panel.
        media = Media(url=relative_path, alt_text=None)
        db.add(media)
        db.flush()
        return media

    source = images_dir / relative_path.lstrip("/")
    if not source.exists():
        print(f"  ! image not found, skipping: {source}")
        return None

    content_type = mimetypes.guess_type(source.name)[0]
    url = storage.save(f"places/{uuid.uuid4().hex[:8]}-{source.name}", source.read_bytes(), content_type)
    media = Media(url=url, alt_text=None)
    db.add(media)
    db.flush()
    return media


def migrate_trips(db, trips: list[dict], images_dir: Path | None) -> None:
    for trip in trips:
        name = trip.get("name") or trip.get("placeName")
        if not name:
            continue
        existing = db.query(Destination).filter(Destination.name == name).first()
        if existing:
            print(f"  = skipping existing destination: {name}")
            continue

        destination = Destination(
            name=name,
            slug=unique_slug(db, Destination, name),
            province=trip.get("province"),
            latitude=trip.get("latitude"),
            longitude=trip.get("longitude"),
            duration=trip.get("duration"),
            access=trip.get("access"),
            accessibility=trip.get("accessibility"),
            best_time=trip.get("bestTime"),
            description=trip.get("description"),
            article=trip.get("article"),
            status="published",
        )
        db.add(destination)
        db.flush()

        image_paths = trip.get("images") or ([trip["image"]] if trip.get("image") else [])
        for order, path in enumerate(image_paths):
            media = copy_image(db, images_dir, path)
            if media:
                db.add(
                    DestinationMedia(
                        destination_id=destination.id, media_id=media.id, sort_order=order
                    )
                )
        db.commit()
        print(f"  + migrated destination: {name} ({len(image_paths)} image(s))")


def migrate_news(db, news_items: list[dict], images_dir: Path | None) -> None:
    for item in news_items:
        title = item.get("title")
        if not title:
            continue
        existing = db.query(NewsEvent).filter(NewsEvent.title == title).first()
        if existing:
            print(f"  = skipping existing news item: {title}")
            continue

        media = copy_image(db, images_dir, item.get("pic"))
        news_event = NewsEvent(
            title=title,
            slug=unique_slug(db, NewsEvent, title),
            date_label=item.get("date"),
            location=item.get("location"),
            description=item.get("description"),
            best_time=item.get("bestTime"),
            accessibility=item.get("accessibility"),
            media_id=media.id if media else None,
            status="published",
        )
        db.add(news_event)
        db.commit()
        print(f"  + migrated news item: {title}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--trips", type=Path, help="Path to tripsData.json")
    parser.add_argument("--news", type=Path, help="Path to newsEvents.json")
    parser.add_argument(
        "--images-dir", type=Path, default=None, help="Old frontend's public/ folder"
    )
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)  # no-op if Alembic already created the tables
    db = SessionLocal()
    try:
        if args.trips:
            print(f"Migrating destinations from {args.trips} ...")
            migrate_trips(db, json.loads(args.trips.read_text()), args.images_dir)
        if args.news:
            print(f"Migrating news/events from {args.news} ...")
            migrate_news(db, json.loads(args.news.read_text()), args.images_dir)
    finally:
        db.close()


if __name__ == "__main__":
    main()
