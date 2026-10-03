"""Import every model module here so Base.metadata (and Alembic autogenerate) sees all tables."""

from app.models.user import OAuthAccount, Role, Session, User, UserRole  # noqa: F401
from app.models.media import Media  # noqa: F401
from app.models.destination import (  # noqa: F401
    Category,
    Destination,
    DestinationCategory,
    DestinationMedia,
    DestinationTag,
    Tag,
)
from app.models.news import NewsEvent  # noqa: F401
from app.models.review import Comment, Favorite, Review, UserActivity  # noqa: F401
from app.models.site_image import SiteImage  # noqa: F401
