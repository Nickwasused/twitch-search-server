#!/usr/bin/env python3
from http.cookiejar import DefaultCookiePolicy
from dotenv import load_dotenv
from models import Streamer
from auth import Auth
import urllib3
import logging
import time
import os

logger = logging.getLogger(__name__)
load_dotenv()


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

        with urllib3.PoolManager(num_pools=50) as http:
            fetching = True
            tmp_cursor = ""
            http.headers = {
                "Authorization": f"Bearer {self.auth.token}",
                "content-type": "application/json",
                "client-id": self.client_id,
            }

            while fetching:
                tmp_url = self.default_url

                if tmp_cursor:
                    tmp_url += f"&after={tmp_cursor}"

                try:
                    stream_request = http.request("GET", tmp_url)
                except Exception as e:
                    logger.error(f"exception while fetching streams: {e}")
                    fetching = False
                    continue

                if stream_request.status == 401:
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

    def filter_streams(self, query: str):
        query_words = query.split()
        filtered_streamers = [
            streamer
            for streamer in self.streamers
            if all(word.lower() in streamer.title.lower() for word in query_words)
        ]

        return filtered_streamers

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.streamers = []
