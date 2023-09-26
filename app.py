#!/usr/bin/env python3
from flask_apscheduler import APScheduler
from flask import Flask, request, Response, jsonify
from fetch import Handler


class Config:
    SCHEDULER_API_ENABLED = True


handler = Handler()

app = Flask(__name__)
app.config.from_object(Config())


@app.route("/")
def index():
    search_query = request.args.to_dict()

    if search_query:
        return jsonify(handler.filter_streams(search_query))
    else:
        return "You can search by adding url parameters e.g. ?title=gta"


@app.after_request
def security_headers(response: Response) -> Response:
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


scheduler = APScheduler()
scheduler.init_app(app)


@scheduler.task('interval', id='update_streamers', seconds=300, misfire_grace_time=900)
def update_streamers():
    handler.get_streamers()


scheduler.start()

if __name__ == '__main__':
    app.run()
