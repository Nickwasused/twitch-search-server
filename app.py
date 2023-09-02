from fetch import get_streamers
import sqlite3

connection = sqlite3.connect("streamers.db")
# connection = = sqlite3.connect(":memory:")


def create_table(tmp_connection: sqlite3.Connection):
    cursor = tmp_connection.cursor()
    with open('create_table.sql', 'r') as sql_file:
        create_table_sql = sql_file.read()

    cursor.execute(create_table_sql)
    tmp_connection.commit()


def update_streamers(tmp_connection: sqlite3.Connection):
    tmp_streamers = get_streamers()
    print(tmp_streamers)
    cursor = tmp_connection.cursor()

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
            '|'.join(str(tag) for tag in tmp_tags),  # Convert tags to strings
            int(streamer.is_mature)
        )
        values.append(value_tuple)

    cursor.executemany("""INSERT INTO streamers (
    id, user_id, user_login, user_name, game_id, game_name, type, title,
    viewer_count, started_at, language, thumbnail_url, tag_ids, tags, is_mature) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", values)

    tmp_connection.commit()


if __name__ == '__main__':
    create_table(connection)
    update_streamers(connection)
