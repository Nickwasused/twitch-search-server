#!/usr/bin/env python3
from dataclasses import dataclass
from dotenv import load_dotenv
from auth import Auth
import requests
import logging
import re
import os

logging.basicConfig(level=logging.INFO)
load_dotenv()
auth = Auth()


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
        self.get_streamers()

    def get_streamers(self):
        token = auth.token
        streamer_url = "https://api.twitch.tv/helix/streams"

        streamers: [Streamer] = []

        fetching = True
        tmp_cursor = ""
        tmp_headers = {
            'content-type': 'application/json',
            'client-id': os.getenv('CLIENT_ID'),
            'Authorization': f'Bearer {token}'
        }

        while fetching:
            tmp_url = f"{streamer_url}?first=100&type=live&language={os.getenv('TWITCH_LANG')}&game_id={os.getenv('GAME_ID')}"

            if tmp_cursor != "":
                tmp_url += f"&after={tmp_cursor}"

            try:
                stream_request = requests.get(tmp_url, headers=tmp_headers)
            except Exception as e:
                logging.error(f"exception while fetching streams: {e}")
                fetching = False
                continue

            if stream_request.status_code == 401:
                try:
                    auth.get_token()
                    continue
                except Exception as e:
                    logging.error(f"exception while getting token: {e}")
                    fetching = False
                    continue

            tmp_fetched_streams = stream_request.json()
            if not tmp_fetched_streams:
                logging.error("fetched streams but with error")
                fetching = False
            else:
                streamers = [*streamers, *tmp_fetched_streams["data"]]

                if tmp_fetched_streams["pagination"] == {} or "pagination" in tmp_fetched_streams \
                        and not tmp_fetched_streams["pagination"]["cursor"] or \
                        tmp_fetched_streams["pagination"]["cursor"] == "IA":
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

        logging.info(f"fetched {len(tmp_converted_streams)} streams")
        self.streamers = tmp_converted_streams

    def filter_streams(self, search: dict):
        filtered_streamers = []
        print(search)
        for streamer in self.streamers:
            match = all(
                (field == 'title' and re.search(value, getattr(streamer, field, ''), re.IGNORECASE)) or
                (field != 'title' and getattr(streamer, field, None) == value)
                for field, value in search.items()
            )
            if match:
                filtered_streamers.append(streamer)
        return filtered_streamers
