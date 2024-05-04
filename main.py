#!/usr/bin/env python3
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from models import Streamer, ResponseModel
from fastapi import FastAPI
from fetch import Handler
import cachetools.func
import logging
import uvicorn


logger = logging.getLogger(__name__)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@cachetools.func.ttl_cache(ttl=10 * 60)
def get_data():
    tmp_handler = Handler()
    tmp_handler.get_streamers()
    return tmp_handler


@app.get("/search")
def search(
    query: str | None = None,
) -> ResponseModel:
    if query:
        tmp_handler = get_data()
        tmp_streamers: list[Streamer] = tmp_handler.filter_streams(query)
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
