import datetime

from pydantic import BaseModel, Field, model_validator


class CommentCreate(BaseModel):
    news_event_id: int | None = None
    destination_id: int | None = None
    body: str = Field(min_length=1, max_length=2000)

    @model_validator(mode="after")
    def exactly_one_target(self):
        if (self.news_event_id is None) == (self.destination_id is None):
            raise ValueError("Give exactly one of news_event_id or destination_id")
        self.body = self.body.strip()
        if not self.body:
            raise ValueError("Comment cannot be empty")
        return self


class CommentOut(BaseModel):
    id: int
    news_event_id: int | None
    destination_id: int | None
    user_id: int
    user_display_name: str | None = None
    user_avatar_url: str | None = None
    body: str
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
