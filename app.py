from fetch import get_streamers, Streamer
import sqlite3
from flask import Flask, render_template, request, abort, g
from waitress import serve
import argparse
from flask_apscheduler import APScheduler


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
    search_title = request.args.get("title")
    cursor.execute(
        '''
        SELECT *
        FROM streamers
        WHERE title LIKE '%'||?||'%'
        ''',
        (search_title,)
    )

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
        "tag_ids": entry[12],
        "tags": entry[13],
        "is_mature": entry[14],
    } for entry in result]
    return new_result


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
            streamer.thumbnail_url, '|'.join(streamer.tag_ids),
            '|'.join(str(tag) for tag in tmp_tags),
            int(streamer.is_mature)
        )
        values.append(value_tuple)

    cursor.executemany("""INSERT INTO streamers (
    id, user_id, user_login, user_name, game_id, game_name, type, title,
    viewer_count, started_at, language, thumbnail_url, tag_ids, tags, is_mature) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", values)

    database.commit()


scheduler.start()
scheduler.run_job("update_streamers")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="frontend")
    parser.add_argument("-w", "--waitress", help="Define if we want to use waitress for the web server.",
                        action="store_true")
    args = parser.parse_args()

    if args.waitress:
        serve(app, port=8000, host="127.0.0.1")
    else:
        # https://werkzeug.palletsprojects.com/en/2.2.x/serving/#werkzeug.serving.run_simple
        app.run(debug=True)
