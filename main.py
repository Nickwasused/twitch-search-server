#!/usr/bin/env python3
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from prometheus_client import make_asgi_app
from contextlib import asynccontextmanager
from models import Streamer, ResponseModel
from prometheus_client import Gauge
from threading import Thread
from fastapi import FastAPI
from fetch import Handler
import logging
import uvicorn
import sched
import time


logger = logging.getLogger(__name__)
handler = Handler()
s = sched.scheduler(time.time, time.sleep)

metrics_app = make_asgi_app()
gauge_streamers = Gauge("streamers", "the current count of streamers", unit="streamers")
histogram_fetch = Gauge("fetch", "time it takes to fetch streamers", unit="seconds")


def update_streamers(sc: sched.scheduler, wait: float = 300):
    tmp_count, tmp_time = handler.get_streamers()
    gauge_streamers.set(tmp_count), histogram_fetch.set(tmp_time)
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


@app.get("/search")
def search(
    tmp_query: str | None = None,
) -> ResponseModel:
    if tmp_query:
        tmp_streamers: list[Streamer] = handler.filter_streams(tmp_query)
        return jsonable_encoder(
            {
                "status": 200,
                "message": f"returned {len(tmp_streamers)} streamers",
                "data": tmp_streamers,
            }
        )
    else:
        return jsonable_encoder(
            {"status": 500, "message": "You need to supply a query.", "data": []}
        )


@app.get("/")
def index() -> RedirectResponse:
    return RedirectResponse("/docs", 301)


if __name__ == "__main__":
    uvicorn.run(app, log_config="log_conf.yaml", access_log=True)
