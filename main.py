#!/usr/bin/env python3
from fetch import Handler, Streamer
from fastapi_utils.tasks import repeat_every
from fastapi.encoders import jsonable_encoder
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

handler = Handler()
app = FastAPI()

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


@app.on_event("startup")
@repeat_every(seconds=300)
def update_streamers():
    handler.get_streamers()
