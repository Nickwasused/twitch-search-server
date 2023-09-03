CREATE VIRTUAL TABLE IF NOT EXISTS streamers USING FTS5(
    id,
    user_id,
    user_login,
    user_name,
    game_id,
    game_name,
    type,
    title,
    viewer_count,
    started_at,
    language,
    thumbnail_url,
    tags,
    is_mature
);