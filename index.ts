// @deno-types="./index.d.ts"
import { serve } from "https://deno.land/std@0.173.0/http/server.ts";
import "https://deno.land/std@0.173.0/dotenv/load.ts";

// load config
const server_config = Deno.env.toObject();
const client_id: string = server_config["CLIENT_ID"];
const client_secret: string = server_config["CLIENT_SECRET"];
const lang: string = server_config["TWITCH_LANG"];
const game_id: string = server_config["GAME_ID"];
const listen_port: number = parseInt(server_config["PORT"] ?? "8000");

// check config
if (client_id == undefined || client_secret == undefined || lang == undefined || game_id == undefined) {
    console.error("missing config");
    Deno.exit(1);
}

// get twitch auth token
let token: string | undefined = await get_auth();
if (token == undefined) {
    Deno.exit(1);
}

let streams: Streamer[] = [];

/**
 * Remove duplicates from a Streams Array
 * @returns {Array[Streamer]} Streams Array without Duplicates
*/
function deduplicate_streams(array: Streamer[]) {
    const uniqueIds = new Set<string>();
    return array.filter((element) => {
        if (!uniqueIds.has(element.id)) {
            uniqueIds.add(element.id);
            return element;
        }
    });
}

/**
 * Get the Twitch auth token
 * @returns {String} Twitch Auth Token
*/
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
    if (api_response.ok) {
        const token: Twitch_Api_Token = await api_response.json();
        console.info("got a access token")
        return token["access_token"]
    } else {
        console.warn("couldn`t get token")
        return undefined
    }
}

/**
 * Get all Streams with the set `lang` and `game_id`
 * @returns {array<Streamer>} Array of Streamers
 * @see {@link Streamer} 
*/
async function get_streams() {
    const streams_url = "https://api.twitch.tv/helix/streams";
    const tempstreams: Streamer[] = [];
    const headers = new Headers({
        "content-type": "application/json",
        "client-id": client_id,
        "Authorization": `Bearer ${token}`
    })
    let fetching = true;
    let paginator: pagination = {};
    
    while (fetching) {
        let url = `${streams_url}?first=100&language=${lang}&game_id=${game_id}`;
        if (paginator.cursor) {
            url = `${url}&after=${paginator.cursor}`;
        }

        let current_streams;

        try {
            current_streams = await fetch(url, {
                headers: headers
            })
        } catch (error) {
            console.error(error);
        }
        
        if (current_streams == undefined) {
            fetching = false;
            console.error(`error while fetching streams!`);
            continue
        }

        if (current_streams.status == 401) {
            token = await get_auth();
        } else {
            const tmp_stream_data: Twitch_Api_Streams = await current_streams.json();
            if (tmp_stream_data == undefined) {
                fetching = false;
                console.error(`done fetching ${tempstreams.length} streams, but with an error!`);
                streams = tempstreams;
                continue
            }
            tempstreams.splice(tempstreams.length, 0, ...tmp_stream_data.data);
            if (tmp_stream_data.pagination.cursor == undefined || tmp_stream_data.pagination.cursor == "IA") {
                fetching = false;
                streams = deduplicate_streams(tempstreams);
                console.info(`done fetching ${streams.length} streams`);
            } else {
                paginator = tmp_stream_data.pagination;
            }
        }
    }
}

// startup fetch and interval setup
// 1 minute interval
await get_streams();
const _fetch_interval: number = setInterval(get_streams.bind(this), 1 * 60 * 1000);

const search_params: string[] = [
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

interface Filter {
    [key: string]: string[];
}

interface Headers {
    [key: string]: string;
}

async function handler(_req: Request): Promise<Response> {
    const params = new URL(_req.url);
    const headers: Headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
    }

    if (params.search == "") {
        const valid_until = new Date();
        valid_until.setSeconds(valid_until.getSeconds() + 600);
        headers["Cache-Control"] = "public, max-age=600";
        headers["content-type"] = "text/plain";
        headers["X-Robots-Tag"] = `nofollow, noarchive, notranslate, unavailable_after: ${valid_until.toUTCString()}`;
        return new Response(`Please use the following filters: ${search_params}`,  { headers: headers });
    }

    const new_params: URLSearchParams = params.searchParams;

    const filters: Filter = {};
    search_params.forEach(param => {
        if (new_params.has(param)) {
            filters[param] = new_params.get(param)?.split(",") ?? []
        }
    });

    const api_response: Streamer[] = streams.filter((stream) => {
        // https://stackoverflow.com/questions/52489741/filter-json-object-array-on-multiple-values-or-arguments-javascript
        const return_stream = Object.keys(filters).every(key => {
            for (let i=0; i<filters[key].length; i++) {
                if (filters[key][i] == "") { return false; } 
                if (stream[key as keyof typeof stream].toString().toLowerCase().includes(filters[key][i].toString().toLowerCase()) || stream[key as keyof typeof stream] == filters[key][i]) {
                    return true;
                }
            }
        });
        return return_stream;
    });

    if (api_response.length != 0) {
        const valid_until = new Date();
        valid_until.setSeconds(valid_until.getSeconds() + 60);
        headers["Cache-Control"] = "public, max-age=60";
        headers["content-type"] = "application/json";
        headers["X-Robots-Tag"] = `nofollow, noarchive, notranslate, unavailable_after: ${valid_until.toUTCString()}`;
        return new Response(JSON.stringify(api_response), { headers: headers });
    } else {
        headers["Cache-Control"] = "public, max-age=60";
        headers["content-type"] = "application/json";
        return new Response(JSON.stringify([]), { headers: headers });
    }
}

await serve(handler, { listen_port });