from fastapi import APIRouter, Depends, Response
from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.destination import Destination
from app.models.news import NewsEvent
from app.models.review import Comment, Review
from app.models.user import User

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
def public_stats(response: Response, db: Session = Depends(get_db)) -> dict:
    """Live, public counts for the About page. Totals only, no personal data."""
    published = Destination.status == "published"
    response.headers["Cache-Control"] = "public, max-age=300"
    return {
        "places": db.query(func.count(Destination.id)).filter(published).scalar() or 0,
        "provinces": db.query(func.count(distinct(Destination.province)))
        .filter(published, Destination.province.isnot(None), Destination.province != "")
        .scalar()
        or 0,
        "reviews": db.query(func.count(Review.id)).filter(Review.status == "published").scalar() or 0,
        "comments": db.query(func.count(Comment.id)).scalar() or 0,
        "members": db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0,
        "stories": db.query(func.count(NewsEvent.id)).filter(NewsEvent.status == "published").scalar() or 0,
        "average_rating": round(
            float(db.query(func.avg(Review.rating)).filter(Review.status == "published").scalar() or 0), 1
        ),
    }
