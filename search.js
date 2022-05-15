import dotenv from "dotenv";
import { promises as fs } from "fs"; 
import axios from 'axios';
import utils from './utils.js';

axios.defaults.timeout === 1000;

dotenv.config()

let client_id = process.env.CLIENT_ID;
let secret = process.env.SECRET;
let host = process.env.HOST;

// select the host automatically on fly.io but respect a overwrite by the HOST key
if (process.env.FLY_APP_NAME != undefined && process.env.HOST == undefined) {
    host = `https://${process.env.FLY_APP_NAME}.fly.dev`
} 

let streams_url = "https://api.twitch.tv/helix/streams";
let paginator = "";
let language = process.env.LANGUAGE;
let game_id = process.env.GAME_ID;
let interval_timer = process.env.INTERVAL_IN_MIN;

if (interval_timer == undefined) {
    // 5 minuets should be okay for a fallback, because we can`t know if the User has other projects that require to use the Twitch API.
    interval_timer = 5;
}

// convert minuets to milliseconds
interval_timer = interval_timer * 60 * 1000;

function get_file_path() {
    const is_fly = process.env.FLY_APP_NAME != undefined;
    let file_path = "./local/local.json";
    if (is_fly) {
        file_path = "/local/local.json"
    }
    return file_path;
}

export class SearchHandler {
    constructor() {
        this.setup_done = false;
        this.fetch_interval = undefined;
        this.streams = [];
        this.access_token = "";
        this.refresh_token = "";
        this.first_fetch_done = false;
        this.rate_limit = 0;
        this.rate_limit_remaining = 0;
        this.ratelimit_reset = 0;
        this.init();
    }

    async init() {
        let file_path = get_file_path();
        if (await utils.checkFileExists(file_path)) {
            let data = JSON.parse(await fs.readFile(file_path, 'utf8'));
            this.access_token = data["access_token"];
            this.refresh_token = data["refresh_token"];
            if (this.access_token != undefined && this.fetch_interval == undefined) {
                this.setup_done = true;
                await this.fetchstreams();
                this.fetch_interval = setInterval(this.fetchstreams.bind(this), interval_timer);
            }
        }
    }

    async get_auth_token(code = "", refresh = false) {
        let token_url = "https://id.twitch.tv/oauth2/token";
        let post_url = `${token_url}?client_id=${client_id}&client_secret=${secret}&code=${code}&grant_type=authorization_code&redirect_uri=${host}/code`;
        if (refresh) {
            post_url = `${token_url}?client_id=${client_id}&client_secret=${secret}&refresh_token=${this.refresh_token}&grant_type=refresh_token&redirect_uri=${host}/code`;
        }
        await Promise.all([
            axios.post(post_url)
            .then((response) => {
                let data = response.data;
                this.access_token = data.access_token;
                this.refresh_token = data.refresh_token;
                fs.writeFile(get_file_path(), JSON.stringify({
                    "access_token": this.access_token,
                    "refresh_token": this.refresh_token
                }), 'utf8');
                clearInterval(this.fetch_interval);
                this.fetch_interval = undefined;
                return true
            })
            .catch(error => {
                // console.error(error);
                return false
            })
        ]);
        if (this.fetch_interval == undefined) {
            await this.fetchstreams();
            this.fetch_interval = setInterval(this.fetchstreams.bind(this), interval_timer);
        }
    }

    async fetchstreams() {
        console.info("fetching streams");
        let fetching = true;
        let token_valid = true;
        let tempstreams = [];
        let search_params = {
            first: 100
        };
        if (language != "" && language != undefined) {
            search_params["language"] = language;
        }
        if (game_id != "" && game_id != undefined) {
            search_params["game_id"] = game_id;
        }

        while (fetching) {
            if (paginator != "" && paginator != undefined) {
                search_params["after"] = paginator;
            }

            await Promise.all([
                axios.get(streams_url, {
                    headers: {
                        "client-id": client_id,
                        "Authorization": `Bearer ${this.access_token}`
                    },
                    params: search_params
                })
                .then((response) => {
                    // the rate limit is 800 requests per minuete for the search endpoint
                    // the limit refills at a constant rate = 1 request per 75ms
                    // if we dont make more than one request per 75ms then the ratelimit-remaining stays at 799
                    if (!this.first_fetch_done) {
                        this.first_fetch_done = true;
                        this.rate_limit = response.headers["ratelimit-limit"];
                        this.rate_limit_remaining = response.headers["ratelimit-remaining"];
                        this.ratelimit_reset = response.headers["ratelimit-reset"];
                    } else {
                        this.rate_limit = response.headers["ratelimit-limit"];
                        this.rate_limit_remaining = response.headers["ratelimit-remaining"];
                        this.ratelimit_reset = response.headers["ratelimit-reset"];
                    }

                    if (this.rate_limit_remaining == 0) {
                        // we can`t hit the API any more so we just end the current request here
                        // this can happen if we don`t filter e.g. for a certain language
                        console.warn("API limit hit please check if you set your filters correctly.");
                        fetching = false;
                    }

                    tempstreams = [...tempstreams, ...response.data.data];
                    if (response.data["pagination"]["cursor"] == undefined || response.data["pagination"]["cursor"] == "IA") {
                        fetching = false;
                    }
                    paginator = response.data["pagination"]["cursor"];
                })
                .catch(error => {
                    // console.error(error);
                    if (error.response.status == 401) {
                        token_valid = false;
                        fetching = false;
                    } else if (error.response.status == 429) {
                        // we hit the API limit
                        let wait_until_unix = error.response.headers["ratelimit-reset"];
                        let now = Math.floor(new Date().getTime() / 1000);
                        let diff = wait_until_unix - now;
                        // lets wait until our Bucket resets
                        if (diff > 0) {
                            setTimeout(() => {
                                fetching = false;
                            }, diff)
                        }
                    }
                })
            ]);
        }

        this.streams = tempstreams;

        console.info(`fetched ${this.streams.length} streams`)

        paginator = "";
        if (!token_valid) {
            console.warn("Our current access_token is invalid requesting new one!");
            await this.get_auth_token("", true);
        }
    }
}

export default {
    SearchHandler
}