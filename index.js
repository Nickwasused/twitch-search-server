const express = require("express");
const axios = require('axios');
require('dotenv').config()
const app = express();

let streams = [];
let client_id = process.env.CLIENT_ID;
let bearer_auth = process.env.BEARER_AUTH;
let paginator = "";
let language = process.env.LANGUAGE;
let game_id = process.env.GAME_ID;

let streams_url = "https://api.twitch.tv/helix/streams";

async function fetchstreams() {
    console.log("Starting to fetch Streams!")
    let fetching = true;
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
                    "Authorization": "Bearer " + bearer_auth,
                },
                params: search_params
            })
            .then(response => {
                for (let i=0; i < response.data["data"].length; i++) {
                    temp_streams.push(response.data["data"][i])
                }
                paginator = response.data["pagination"]["cursor"];
                if (response.data["data"].length == 0) {
                    fetching = false;
                }
            })
            .catch(error => {
                console.log(error);
            })
        ]);
        console.log(`We have fetched ${temp_streams.length} Streams!`)
    }

    console.log("Done fetching Streams!")
    paginator = "";
    streams = temp_streams;
    
    return;
}

async function startup() {
    await fetchstreams();
    setInterval(fetchstreams, 300000);
}


app.get("/search", (request, response) => {
    response.type('json');
    response.header("Access-Control-Allow-Origin", "*");
    let search_title = request.query.title;
    let search_viewers = request.query.viewers;
    let search_game = request.query.game;
    let search_language = request.query.language;
    let api_response = streams.filter((stream) => {
        let { title, game_id, language, viewer_count } = stream;
        if (search_title != undefined && !title.toLowerCase().includes(search_title.toLowerCase())) {
            return null;
        } else if (search_viewers != undefined && !viewer_count == search_viewers) {
            return null;
        } else if (search_game != undefined && !game_id == search_game) {
            return null;
        } else if (search_language != undefined && !language == search_language) {
            return null;
        } else {
            return stream;
        }
        
    });
    response.send(JSON.stringify(api_response));
});

app.get("/", (request, response) => {
    response.type('html');
    let html = "<h1>Docs</h1><h2>Endpoints</h2><p>/search</p><ul><li>title</li><li>viewers</li><li>game</li><li>language</li></ul>";
    response.send(html);
});

app.listen(3000, () => {
    startup()
    console.log("Listen on the port 3000...");
});