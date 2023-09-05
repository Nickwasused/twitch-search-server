#!/usr/bin/env python3
from dataclasses import dataclass
from dotenv import load_dotenv
from auth import get_token
import requests
import logging
import os

logging.basicConfig(level=logging.INFO)
load_dotenv()
token = get_token()


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
    tag_ids: [str]
    tags: [str]
    is_mature: bool

    def __hash__(self):
        return int(self.id)


# https://stackoverflow.com/a/282589
def remove_duplicates(seq):
    seen = {}
    pos = 0
    for item in seq:
        if item not in seen:
            seen[item] = True
            seq[pos] = item
            pos += 1
    del seq[pos:]


def get_streamers():
    global token
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
                token = get_token()
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
        tmp_converted_streams.append(Streamer(**item))

    remove_duplicates(tmp_converted_streams)

    logging.info(f"fetched {len(tmp_converted_streams)} streams")
    return tmp_converted_streams
