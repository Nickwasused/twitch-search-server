#!/usr/bin/env python3
from dataclasses import dataclass
from pydantic import BaseModel


class StreamerModel(BaseModel):
    id: str
    user_id: str
    user_login: str
    user_name: str
    game_id: str
    game_name: str
    type: str
    title: str
    viewer_count: int
    started_at: str
    language: str
    thumbnail_url: str
    tags: list[str]
    is_mature: bool


class ResponseModel(BaseModel):
    status: int
    message: str
    data: list[StreamerModel]


@dataclass
class Streamer:
    id: str
    user_id: str
    user_login: str
    user_name: str
    game_id: str
    game_name: str
    type: str
    title: str
    viewer_count: int
    started_at: str
    language: str
    thumbnail_url: str
    tags: list[str]
    is_mature: bool

    def __hash__(self):
        return int(self.id)
