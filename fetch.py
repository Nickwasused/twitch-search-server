#!/usr/bin/env python3
from http.cookiejar import DefaultCookiePolicy
from dataclasses import dataclass
from dotenv import load_dotenv
from requests import Session
from auth import Auth
import logging
import time
import re
import os

logger = logging.getLogger(__name__)
load_dotenv()


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


class Handler:
    def __init__(self):
        self.streamers = []
        self.client_id = os.getenv("CLIENT_ID")
        self.game_id = os.getenv("GAME_ID")
        self.lang = os.getenv("TWITCH_LANG")
        self.default_url = f"https://api.twitch.tv/helix/streams?first=100&type=live&language={self.lang}&game_id={self.game_id}"
        self.auth = Auth()

    def get_streamers(self) -> [int, float]:
        start = time.perf_counter()
        streamers: [Streamer] = []

        with Session() as session:
            session.cookies.set_policy(DefaultCookiePolicy(allowed_domains=[]))
            fetching = True
            tmp_cursor = ""
            session.headers.update(
                {
                    "Authorization": f"Bearer {self.auth.token}",
                    "content-type": "application/json",
                    "client-id": self.client_id,
                }
            )

            while fetching:
                tmp_url = self.default_url

                if tmp_cursor:
                    tmp_url += f"&after={tmp_cursor}"

                try:
                    stream_request = session.get(tmp_url)
                except Exception as e:
                    logger.error(f"exception while fetching streams: {e}")
                    fetching = False
                    continue

                if stream_request.status_code == 401:
                    try:
                        self.auth.get_token()
                        continue
                    except Exception as e:
                        logger.error(f"exception while getting token: {e}")
                        fetching = False
                        continue

                tmp_fetched_streams = stream_request.json()
                if not tmp_fetched_streams:
                    logger.error("fetched streams but with error")
                    fetching = False
                else:
                    streamers = [*streamers, *tmp_fetched_streams["data"]]

                    if (
                        not tmp_fetched_streams["pagination"]
                        or tmp_fetched_streams["pagination"]["cursor"] == "IA"
                    ):
                        fetching = False
                        continue
                    else:
                        tmp_cursor = tmp_fetched_streams["pagination"]["cursor"]

        tmp_converted_streams: [Streamer] = []
        for item in streamers:
            del item["tag_ids"]
            tmp_converted_streams.append(Streamer(**item))

        # deduplication
        tmp_converted_streams = list(dict.fromkeys(tmp_converted_streams))
        tmp_count = len(tmp_converted_streams)
        self.streamers = tmp_converted_streams
        end = time.perf_counter() - start
        return tmp_count, end

    def filter_streams(self, search: dict):
        filtered_streamers = []
        for streamer in self.streamers:
            match = all(
                (
                    field == "title"
                    and re.search(value, getattr(streamer, field, ""), re.IGNORECASE)
                )
                or (field != "title" and getattr(streamer, field, None) == value)
                for field, value in search.items()
            )
            if match:
                filtered_streamers.append(streamer)
        return filtered_streamers

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.streamers = []
