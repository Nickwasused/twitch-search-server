import { Database } from './database.js';
import axios from 'axios';

axios.defaults.timeout === 1000;

let streams_url = "https://api.twitch.tv/helix/streams";
let paginator = "";

export class SearchHandler {
    constructor() {}

    async init() {
        this.database = new Database();
        await this.database.init();
        this.settings_object = await this.database.get_settings();
        this.setup_done = false;
        this.fetch_interval = undefined;
        this.streams = [];
        this.access_token = "";
        this.refresh_token = "";
        this.first_fetch_done = false;
        this.rate_limit = 0;
        this.rate_limit_remaining = 0;
        this.ratelimit_reset = 0;
        this.language = this.settings_object["LANGUAGE"];
        this.game_id = this.settings_object["GAME_ID"];
        this.interval_timer = this.settings_object["INTERVAL_IN_MIN"];
        this.client_id = await this.database.get_client_id();
        this.secret = await this.database.get_secret();
        this.host = this.settings_object["HOST"];
        // convert minuets to milliseconds
        this.interval_timer = this.interval_timer * 60 * 1000;

        if (await this.database.checkifauthexists()) {
            const auth_data = await this.database.get_auth();
            this.access_token = auth_data["access_token"];
            this.refresh_token = auth_data["refresh_token"];
            this.setup_done = true;
            await this.fetchstreams();
            this.fetch_interval = setInterval(this.fetchstreams.bind(this), this.interval_timer);
        }
        await this.database.close();
    }

    async get_auth_token(code = "", refresh = false) {
        let token_url = "https://id.twitch.tv/oauth2/token";
        let post_url = `${token_url}?client_id=${this.client_id}&client_secret=${this.secret}&code=${code}&grant_type=authorization_code&redirect_uri=${this.host}/code`;
        if (refresh) {
            post_url = `${token_url}?client_id=${this.client_id}&client_secret=${this.secret}&refresh_token=${this.refresh_token}&grant_type=refresh_token&redirect_uri=${this.host}/code`;
        }
        await Promise.all([
            axios.post(post_url)
            .then((response) => {
                let data = response.data;
                this.access_token = data.access_token;
                this.refresh_token = data.refresh_token;
                this.database.connect();
                this.database.set_auth(this.access_token, this.refresh_token).finally(() => {
                    this.database.close();
                });
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
            this.fetch_interval = setInterval(this.fetchstreams.bind(this), this.interval_timer);
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
        if (this.language != "" && this.language != undefined) {
            search_params["language"] = this.language;
        }
        if (this.game_id != "" && this.game_id != undefined) {
            search_params["game_id"] = this.game_id;
        }

        while (fetching) {
            if (paginator != undefined && paginator != "") {
                search_params["after"] = paginator;
            }

            await Promise.all([
                axios.get(streams_url, {
                    headers: {
                        "client-id": this.client_id,
                        "Authorization": `Bearer ${this.access_token}`
                    },
                    params: search_params
                })
                .then((response) => {
                    if (response == undefined || response == null) {
                        fetching = false;
                    }
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

        console.info(`fetched ${this.streams.length} streams`);

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