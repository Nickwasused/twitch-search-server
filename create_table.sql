CREATE TABLE IF NOT EXISTS streamers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_login TEXT,
    user_name TEXT,
    game_id TEXT,
    game_name TEXT,
    type TEXT,
    title TEXT,
    viewer_count INTEGER,
    started_at TEXT,
    language TEXT,
    thumbnail_url TEXT,
    tag_ids TEXT,
    tags TEXT,
    is_mature INTEGER
);