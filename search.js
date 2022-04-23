require('dotenv').config();
const { promises: fs } = require("fs");
const axios = require('axios');
const utils = require('./utils');
const Stream = require('./stream');

let client_id = process.env.CLIENT_ID;
let secret = process.env.SECRET;
let host = process.env.HOST;
let streams_url = "https://api.twitch.tv/helix/streams";
let paginator = "";
let language = process.env.LANGUAGE;
let game_id = process.env.GAME_ID;

class SearchHandler {
    constructor() {
        this.setup_done = false;
        this.fetch_interval = undefined;
        this.streams = [];
        this.access_token = "";
        this.refresh_token = "";
        this.init();
    }

    async init() {
        if (await utils.checkFileExists("./local.json")) {
            let data = JSON.parse(await fs.readFile('local.json', 'utf8'));
            this.access_token = data["access_token"];
            this.refresh_token = data["refresh_token"];
            if (this.access_token != undefined && this.fetch_interval == undefined) {
                this.setup_done = true;
                await this.fetchstreams();
                this.fetch_interval = setInterval(this.fetchstreams.bind(this), 300000);
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
                fs.writeFile('local.json', JSON.stringify({
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
            this.fetch_interval = setInterval(this.fetchstreams.bind(this), 300000);
        }
    }

    async fetchstreams() {
        console.info("fetching streams");
        let fetching = true;
        let token_valid = true;
        let temp_streams = [];
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
                        "Authorization": "Bearer " + this.access_token
                    },
                    params: search_params
                })
                .then((response) => {
                    temp_streams = [...temp_streams, ...response.data.data];
                    paginator = response.data["pagination"]["cursor"];
                    if (response.data["data"].length == 0) {
                        fetching = false;
                    }
                })
                .catch(error => {
                    // console.error(error);
                    if (error.response.status == 401) {
                        token_valid = false;
                        fetching = false;
                    }
                })
            ]);
        }

        console.info(`fetched ${temp_streams.length} streams`)

        paginator = "";
        if (!token_valid) {
            console.warn("Our current access_token is invalid requesting new one!");
            await this.get_auth_token("", true);
        }

        let streams_list = [];
        temp_streams.forEach(stream => {
            streams_list.push(new Stream(stream));
        });
        this.streams = streams_list;
    }
}

module.exports = SearchHandler;