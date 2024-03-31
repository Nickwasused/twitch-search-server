#!/usr/bin/env python3
from contextlib import asynccontextmanager

import uvicorn

from fetch import Handler, Streamer
from fastapi.encoders import jsonable_encoder
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio

handler = Handler()


async def update_streamers(wait: int = 300):
    while True:
        handler.get_streamers()
        await asyncio.sleep(wait)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """background task starts at startup
    https://stackoverflow.com/a/78046933
    """
    _streamer_task = asyncio.create_task(update_streamers())
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
async def index(title: str | None = None,
                game_id: str | None = None,
                game_name: str | None = None,
                language: str | None = None,
                is_mature: bool | None = None,
                type: str | None = None) -> list[Streamer] | str:
    search_query = {
        "title": title,
        "game_id": game_id,
        "game_name": game_name,
        "language": language,
        "is_mature": is_mature,
        "type": type
    }
    search_query = {k: v for k, v in search_query.items() if v is not None and not ""}

    if search_query and search_query != {}:
        return jsonable_encoder(handler.filter_streams(search_query))
    else:
        return "The docs are at /docs You can search by adding url parameters e.g. ?title=gta"

if __name__ == "__main__":
    uvicorn.run(app, log_config="log_conf.yaml")
