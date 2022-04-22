const express = require("express");
const axios = require('axios');
const { promises: fs } = require("fs");
require('dotenv').config()
const app = express();

let streams = [];
let paginator = "";
let language = process.env.LANGUAGE;
let game_id = process.env.GAME_ID;
let setup_done = false;
let streams_url = "https://api.twitch.tv/helix/streams";

let fetch_interval = undefined;

// auth stuff
let client_id = process.env.CLIENT_ID;
let secret = process.env.SECRET;
let current_state = "";
let host = process.env.HOST;
let access_token = "";
let refresh_token = "";

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// https://www.kindacode.com/article/how-to-easily-generate-a-random-string-in-node-js/
const generateRandomString = (myLength) => {
    const chars =
      "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
    const randomArray = Array.from(
      { length: myLength },
      (v, k) => chars[Math.floor(Math.random() * chars.length)]
    );
  
    const randomString = randomArray.join("");
    return randomString;
};

// https://sabe.io/blog/node-check-file-exists-async-await
async function checkFileExists(file){
    return !!(await fs.stat(file).catch(e => false))
}

async function fetchstreams() {
    console.log("Starting to fetch Streams!");
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
                    "Authorization": "Bearer " + access_token
                },
                params: search_params
            })
            .then(response => {
                for (let i=0; i < response.data["data"].length; i++) {
                    let item = response.data["data"][i];
                    temp_streams.push(item);
                }
                paginator = response.data["pagination"]["cursor"];
                if (response.data["data"].length == 0) {
                    fetching = false;
                }
            })
            .catch(error => {
                if (error.response.status == 401) {
                    token_valid = false;
                    fetching = false;
                }
            })
        ]);
        console.log(`fetched ${temp_streams.length} streams`)
    }

    console.log("Done fetching Streams!");
    paginator = "";
    streams = temp_streams;
    if (!token_valid) {
        console.log("Our current access_token is invalid requesting new one!");
        get_auth_token("", true);
    }
    
    return;
}

app.get("/search", (request, response) => {
    if (setup_done) {
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
        response.send({
            "status": "done",
            "data": api_response
        });
    } else {
        response.type('json');
        response.header("Access-Control-Allow-Origin", "*");
        response.send({
            "status": "setup"
        });
    }
});

async function get_auth_token(code = "", refresh = false) {
    let token_url = "https://id.twitch.tv/oauth2/token";
    let post_url = `${token_url}?client_id=${client_id}&client_secret=${secret}&code=${code}&grant_type=authorization_code&redirect_uri=${host}/code`;
    if (refresh) {
        post_url = `${token_url}?client_id=${client_id}&client_secret=${secret}&refresh_token=${refresh_token}&grant_type=refresh_token&redirect_uri=${host}/code`;
    }
    await Promise.all([
        axios.post(post_url)
        .then(response => {
            let data = response.data;
            access_token = data.access_token;
            refresh_token = data.refresh_token;
            fs.writeFile('local.json', JSON.stringify({
                "access_token": access_token,
                "refresh_token": refresh_token
            }), 'utf8');
            clearInterval(fetch_interval);
            fetch_interval = undefined;
            return true
        })
        .catch(error => {
            // console.log(error);
            return false
        })
    ]);
    if (fetch_interval == undefined) {
        fetchstreams();
        fetch_interval = setInterval(fetchstreams, 300000);
    }
}

app.get("/code", (request, response) => {
    response.type('json');
    response.header("Access-Control-Allow-Origin", "*");
    let code = request.query.code;
    let state = request.query.state;
    if (state != current_state) {
        console.log("wrong state returned");
        response.send({
            "status": "error"
        });
    } else {
        let token_gen = get_auth_token(code);
        if (token_gen) {
            setup_done = true;
        }
        if (code == undefined) {
            response.send({
                "status": "error"
            });
        } else {
            response.send({
                "status": "done"
            });
        }
    }
    
});

app.get("/", (request, response) => {
    if (setup_done) {
        if (fetch_interval == undefined) {
            fetchstreams();
            fetch_interval = setInterval(fetchstreams, 300000);
        }
        response.type('json');
        response.send({
            "status": "done"
        });
    } else {
        let state = generateRandomString(32);
        current_state = state;
        response.redirect(301, `https://id.twitch.tv/oauth2/authorize?response_type=code&scope=&client_id=${client_id}&redirect_uri=${host}/code&state=${state}`);
    }
});

async function startup() {
    if (await checkFileExists("./local.json")) {
        let data = JSON.parse(await fs.readFile('local.json', 'utf8'));
        access_token = data["access_token"];
        refresh_token = data["refresh_token"];
        if (access_token != undefined && fetch_interval == undefined) {
            setup_done = true;
            await fetchstreams();
            fetch_interval = setInterval(fetchstreams, 300000);
        }
    }
}

app.listen(3000, () => {
    startup()
    console.log("Listen on the port 3000...");
});