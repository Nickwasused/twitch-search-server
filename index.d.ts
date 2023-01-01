type Streamer = {
    id: string;
    user_id: string;
    user_login: string;
    user_name: string;
    game_id: string;
    game_name: string;
    type: string;
    title: string;
    viewer_count: number;
    started_at: string;
    language: string;
    thumbnail_url: string;
    tag_ids: Array<string>;
    is_mature: boolean;
}

type Twitch_Api_Streams = {
    data: Array<Streamer>,
    pagination: pagination
}

type Twitch_Api_Token = {
    access_token: string,
    expires_in: number,
    token_type: string
}

type pagination = {
    cursor?: string
}