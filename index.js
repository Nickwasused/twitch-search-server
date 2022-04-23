require('dotenv').config();
const express = require("express");
const app = express();
const utils = require('./utils');
const SearchHandler = require('./search');

let fetch_interval = undefined;

// auth stuff
let current_state = "";
let host = process.env.HOST;

const search = new SearchHandler();

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    next();
});

app.get("/search", (request, response) => {
    if (search.setup_done) {
        response.type('json');
        response.header("Access-Control-Allow-Origin", "*");
        let search_title = request.query.title;
        let search_viewers = request.query.viewers;
        let search_game = request.query.game;
        let search_language = request.query.language;
        let api_response = search.streams.filter((stream) => {
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
        let token_gen = search.get_auth_token(code);
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
    if (search.setup_done) {
        if (fetch_interval == undefined) {
            search.fetchstreams();
            search.fetch_interval = setInterval(search.fetchstreams, 300000);
        }
        response.type('json');
        response.send({
            "status": "done"
        });
    } else {
        let state = utils.generateRandomString(32);
        current_state = state;
        response.redirect(301, `https://id.twitch.tv/oauth2/authorize?response_type=code&scope=&client_id=${client_id}&redirect_uri=${host}/code&state=${state}`);
    }
});

app.listen(3000, () => {
    console.info("server listening on port 3000");
});