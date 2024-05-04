#!/usr/bin/env python3
from dotenv import load_dotenv
from models import Streamer
from auth import Auth
import cachetools.func
import urllib3
import logging
import os

logger = logging.getLogger(__name__)
load_dotenv()


client_id = os.getenv("CLIENT_ID")
game_id = os.getenv("GAME_ID")
lang = os.getenv("TWITCH_LANG")
default_url = f"https://api.twitch.tv/helix/streams?first=100&type=live&language={lang}&game_id={game_id}"
auth = Auth()


@cachetools.func.ttl_cache(ttl=250)
def streamers() -> [Streamer]:
    with urllib3.PoolManager(num_pools=50) as http:
        fetching = True
        tmp_cursor = ""
        http.headers = {
            "Authorization": f"Bearer {auth.token}",
            "content-type": "application/json",
            "client-id": client_id,
        }
        tmp_streamers = []

        while fetching:
            tmp_url = default_url

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
                    auth.get_token()
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
                tmp_streamers = [*tmp_streamers, *tmp_fetched_streams["data"]]

                if (
                    not tmp_fetched_streams["pagination"]
                    or tmp_fetched_streams["pagination"]["cursor"] == "IA"
                ):
                    fetching = False
                    continue
                else:
                    tmp_cursor = tmp_fetched_streams["pagination"]["cursor"]

    tmp_converted_streams: [Streamer] = []
    for item in tmp_streamers:
        del item["tag_ids"]
        tmp_converted_streams.append(Streamer(**item))

    # deduplication
    tmp_converted_streams = list(dict.fromkeys(tmp_converted_streams))
    return tmp_converted_streams


def filter_streams(query: str):
    query_words = query.split()
    filtered_streamers = [
        streamer
        for streamer in streamers()
        if all(word.lower() in streamer.title.lower() for word in query_words)
    ]

    return filtered_streamers
