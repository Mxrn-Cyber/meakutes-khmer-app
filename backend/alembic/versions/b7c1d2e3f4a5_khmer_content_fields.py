"""Khmer content fields

Revision ID: b7c1d2e3f4a5
Revises: 9a5fe4698d3b
Create Date: 2026-09-30
"""
import sqlalchemy as sa
from alembic import op

revision = "b7c1d2e3f4a5"
down_revision = "9a5fe4698d3b"
branch_labels = None
depends_on = None

COLUMNS = [
    ("destinations", "name_km", sa.String(255)),
    ("destinations", "description_km", sa.Text()),
    ("destinations", "article_km", sa.Text()),
    ("news_events", "title_km", sa.String(255)),
    ("news_events", "description_km", sa.Text()),
    ("categories", "name_km", sa.String(120)),
    ("tags", "name_km", sa.String(120)),
]


def upgrade() -> None:
    for table, name, type_ in COLUMNS:
        op.add_column(table, sa.Column(name, type_, nullable=True))


def downgrade() -> None:
    for table, name, _ in reversed(COLUMNS):
        op.drop_column(table, name)
