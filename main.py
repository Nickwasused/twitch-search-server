#!/usr/bin/env python3
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from contextlib import asynccontextmanager
from fetch import Handler, Streamer
from threading import Thread
from fastapi import FastAPI
import uvicorn
import sched
import time

handler = Handler()
s = sched.scheduler(time.time, time.sleep)


def update_streamers(sc: sched.scheduler, wait: float = 300):
    handler.get_streamers()
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
) -> list[Streamer] | str:
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
        return "The docs are at /docs You can search by adding url parameters e.g. ?title=gta"


if __name__ == "__main__":
    uvicorn.run(app, log_config="log_conf.yaml")
