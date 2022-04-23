class Stream {
    // receive a Twitch Stream item in JSON format
    constructor(item) {
        this.id = item["id"];
        this.user_id = item["user_id"];
        this.user_login = item["user_login"];
        this.user_name = item["user_name"];
        this.game_id = item["game_id"];
        this.game_name = item["game_name"];
        this.type = item["type"];
        this.title = item["title"];
        this.viewer_count = item["viewer_count"];
        this.started_at = item["started_at"];
        this.language = item["language"];
        this.thumbnail_url = item["thumbnail_url"];
        this.tag_ids = item["tag_ids"];
        this.is_mature = item["is_mature"];
    }
}

module.exports = Stream;