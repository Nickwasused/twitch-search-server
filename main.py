#!/usr/bin/env python3
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Gauge, Histogram
from fastapi.encoders import jsonable_encoder
from prometheus_client import make_asgi_app
from contextlib import asynccontextmanager
from fetch import Handler, Streamer
from threading import Thread
from fastapi import FastAPI
import logging
import uvicorn
import sched
import time


logger = logging.getLogger(__name__)
handler = Handler()
s = sched.scheduler(time.time, time.sleep)

metrics_app = make_asgi_app()
gauge_streamers = Gauge("streamers", "the current count of streamers", unit="streamers")
histogram_fetch = Histogram("fetch", "time it takes to fetch streamers", unit="seconds")


def update_streamers(sc: sched.scheduler, wait: float = 300):
    tmp_count, tmp_time = handler.get_streamers()
    gauge_streamers.set(tmp_count), histogram_fetch.observe(tmp_time)
    logger.info(f"fetched {tmp_count} streams in {tmp_time:.4f} seconds")
    sc.enter(
        wait,
        1,
        update_streamers,
        (
            sc,
            wait,
        ),
    )
    sc.run()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """background task starts at startup https://stackoverflow.com/a/75266289"""
    thread = Thread(target=update_streamers, kwargs=dict(sc=s, wait=300))
    thread.start()
    yield


app = FastAPI(lifespan=lifespan)
app.mount("/metrics", metrics_app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
async def index(
    title: str | None = None,
    game_id: str | None = None,
    game_name: str | None = None,
    language: str | None = None,
    is_mature: bool | None = None,
    type: str | None = None,
) -> list[Streamer] | dict:
    search_query = {
        "title": title,
        "game_id": game_id,
        "game_name": game_name,
        "language": language,
        "is_mature": is_mature,
        "type": type,
    }
    search_query = {k: v for k, v in search_query.items() if v is not None and not ""}

    if search_query and search_query != {}:
        return jsonable_encoder(handler.filter_streams(search_query))
    else:
        return jsonable_encoder(
            {
                "status": "empty query",
                "docs": "The docs are at /docs You can search by adding url parameters e.g. ?title=gta",
                "metrics": "The metrics are at /metrics",
            }
        )


if __name__ == "__main__":
    uvicorn.run(app, log_config="log_conf.yaml")
