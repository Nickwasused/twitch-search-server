class Stream {
    // receive a Twitch Stream item in JSON format
    constructor(item) {
        this.id = item["user_id"]
    }
}

module.exports = Stream;