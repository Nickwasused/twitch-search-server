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
    tags: Array<string>;
    is_mature: boolean;
}

type Twitch_Api_Streams = {
    data: Array<Streamer>,
    pagination: pagination
}

type pagination = {
    cursor?: string
}

interface Filter {
    [key: string]: string[];
}

interface Params {
    [key: string]: string;
}