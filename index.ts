import { serve } from "https://deno.land/std@0.149.0/http/server.ts";
import { config } from "https://deno.land/std@0.149.0/dotenv/mod.ts";

// start config

const server_config = await config();

let client_id: string;
let client_secret: string;
let lang: string;
let game_id: string;
let listen_port: Number;

client_id = server_config["CLIENT_ID"];
client_secret = server_config["CLIENT_SECRET"];
lang = server_config["LANG"];
game_id = server_config["GAME_ID"];
listen_port = parseInt(server_config["PORT"]);

if (client_id == undefined) {
    client_id = Deno.env.get("CLIENT_ID");
}

if (client_secret == undefined) {
    client_secret = Deno.env.get("CLIENT_SECRET");
}

if (lang == undefined) {
    lang = Deno.env.get("LANG");
}

if (game_id == undefined) {
    game_id = Deno.env.get("GAME_ID");
}

if (listen_port == undefined) {
    listen_port = parseInt(Deno.env.get("PORT") ?? "8000");
}

// end config

let token = await get_auth();
if (token == undefined) {
    Deno.exit(1);
}

let streams = <any[]>[];

async function get_auth() {
    const token_url = "https://id.twitch.tv/oauth2/token";
    const headers = new Headers({ "content-type": "application/json" });
    const api_response = await fetch(token_url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "client_credentials"
        })
    })
    if (api_response.status == 200) {
        let token = await api_response.json();
        console.info("got a access token")
        return token["access_token"]
    } else {
        console.warn("couldn`t get token")
        return undefined
    }
}

async function get_streams() {
    const streams_url = "https://api.twitch.tv/helix/streams";
    let fetching = true;
    let tempstreams = <any[]>[];
    let paginator = "";

    while (fetching) {
        let headers = new Headers({
            "content-type": "application/json",
            "client-id": client_id,
            "Authorization": `Bearer ${token}`
        })

        let url = `${streams_url}?first=100&language=${lang}&game_id=${game_id}`;
        if (paginator != undefined && paginator != "") {
            url = `${url}&after=${paginator}`;
        }

        let current_streams = await fetch(url, {
            headers: headers
        })

        if (current_streams.status == 401) {
            token = await get_auth();
        }

        let tmp_stream_data = await current_streams.json();
        tempstreams = [...tempstreams, ...tmp_stream_data["data"]];
        if (tmp_stream_data["pagination"]["cursor"] == undefined || tmp_stream_data["pagination"]["cursor"] == "IA") {
            fetching = false;
            console.info(`done fetching ${tempstreams.length} streams`);
            streams = tempstreams;
        } else {
            paginator = tmp_stream_data["pagination"]["cursor"];
        }
    }
}

// startup fetch and interval setup
// 1 minute interval
await get_streams();
const fetch_interval = setInterval(get_streams.bind(this), 1 * 60 * 1000);

const search_params = [
    "id",
    "user_id",
    "user_login",
    "user_name",
    "game_id",
    "game_name",
    "type",
    "title",
    "viewer_count",
    "started_at",
    "language",
    "thumbnail_url",
    "tag_ids",
    "is_mature"
];

function handler(req: Request): Response {
    const request = req;
    const params = new URL(request.url).searchParams;
    
    let filters = <any[]>[];
    search_params.forEach(param => {
        if (params.has(param)) {
            filters.push({
               "param": param, 
               "value": params.get(param)
            })
        }
    });

    let api_response = streams.filter((stream) => {
        let pass = false;
        filters.forEach(filter => {
            let local_pass= false;
            let values = <string[]>filter.value.split(",");
            values.forEach((value) => {
                if (value === '') {
                    if (!pass) {
                        pass = false;
                    }
                } else {
                    if (stream[filter.param].toString().toLowerCase().includes(value.toString().toLowerCase()) || stream[filter.param] == value) {
                        pass = true;
                        local_pass = true;
                    } else {
                        if (!local_pass) {
                            pass = false; 
                        }
                    }
                }

            })
        })
        if (pass) {
            return stream;
        } else {
            return null;
        }
    });

    if (api_response.length != 0) {
        return new Response(JSON.stringify(api_response), {
            headers: {
                "content-type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Cache-Control": "public, max-age=60"
            }
        });
    } else {
        return new Response(`Please use the following filters: ${search_params}`, {
            headers: {
                "content-type": "text/plain",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Cache-Control": "public, max-age=600"
            }
        });
    }

    
}

serve(handler, { port: listen_port });