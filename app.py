#!/usr/bin/env python3
from flask_apscheduler import APScheduler
from flask import Flask, request
from fetch import get_streamers
import sqlite3


class Config:
    SCHEDULER_API_ENABLED = True


app = Flask(__name__)
app.config.from_object(Config())


# Fixme: There should be a better solution!
database = sqlite3.connect(":memory:", check_same_thread=False)
cursor = database.cursor()
with open('schema.sql', 'r') as sql_file:
    create_table_sql = sql_file.read()

cursor.execute(create_table_sql)
database.commit()


@app.route("/")
def index():
    search_query = request.args.get("search")

    if search_query:
        cursor.execute('''
            SELECT * FROM streamers WHERE streamers MATCH ?
        ''', (search_query,))

        result = cursor.fetchall()

        new_result = [{
            "id": entry[0],
            "user_id": entry[1],
            "user_login": entry[2],
            "user_name": entry[3],
            "game_id": entry[4],
            "game_name": entry[5],
            "type": entry[6],
            "title": entry[7],
            "viewer_count": entry[8],
            "started_at": entry[9],
            "language": entry[10],
            "thumbnail_url": entry[11],
            "tags": entry[12],
            "is_mature": entry[13],
        } for entry in result]
        return new_result
    else:
        return "Search by adding the url parameter 'search'. E.g. ?search=deutsch"


scheduler = APScheduler()
scheduler.init_app(app)


@scheduler.task('interval', id='update_streamers', seconds=300, misfire_grace_time=900)
def update_streamers():
    tmp_streamers = get_streamers()
    cursor.execute("DELETE FROM streamers;")

    values = []
    for streamer in tmp_streamers:
        tmp_tags = []
        if streamer.tags:
            tmp_tags = streamer.tags

        value_tuple = (
            streamer.id, streamer.user_id, streamer.user_login, streamer.user_name,
            streamer.game_id, streamer.game_name, streamer.type, streamer.title,
            streamer.viewer_count, streamer.started_at, streamer.language,
            streamer.thumbnail_url, ','.join(str(tag) for tag in tmp_tags),
            int(streamer.is_mature)
        )
        values.append(value_tuple)

    cursor.executemany("""INSERT INTO streamers (
    id, user_id, user_login, user_name, game_id, game_name, type, title,
    viewer_count, started_at, language, thumbnail_url, tags, is_mature) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", values)

    database.commit()


scheduler.start()
scheduler.run_job("update_streamers")

if __name__ == '__main__':
    app.run()
