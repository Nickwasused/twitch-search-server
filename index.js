require('dotenv').config();
const express = require("express");
const compression = require('compression');
const app = express();
const utils = require('./utils');
const SearchHandler = require('./search');

app.use(compression());

// auth stuff
let current_state = "";
let client_id = process.env.CLIENT_ID;
let host = process.env.HOST;
const search = new SearchHandler();

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    next();
});

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

app.get("/search", (request, response) => {
    if (search.setup_done) {
        response.type('json');
        let filters = [];
        search_params.forEach(param => {
            if (request.query.hasOwnProperty(param)) {
                filters.push({
                   "param": param, 
                   "value": request.query[param]
                })
            }
        });

        let api_response = search.streams.filter((stream) => {
            let pass = false;
            filters.forEach(filter => {
                if (stream[filter.param].toString().toLowerCase().includes(filter.value.toString().toLowerCase()) || stream[filter.param] == filter.value) {
                    pass = true;
                } else {
                    pass = false;
                    return;
                }
            })
            if (pass) {
                return stream;
            } else {
                return null;
            }
        });
        response.send({
            "status": "done",
            "data": api_response
        });
    } else {
        response.type('json');
        response.send({
            "status": "setup"
        });
    }
});

app.get("/code", (request, response) => {
    response.type('json');
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
            search.setup_done = true;
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

app.get("/setup", (request, response) => {
    if (!search.setup_done) {
        let state = utils.generateRandomString(32);
        current_state = state;
        response.redirect(301, `https://id.twitch.tv/oauth2/authorize?response_type=code&scope=&client_id=${client_id}&redirect_uri=${host}/code&state=${state}`);
    } else {
        response.type('json');
        response.send({
            "status": "done"
        });
    }
});

app.get("/", (request, response) => {
    if (search.setup_done) {
        response.type('json');
        response.send({
            "status": "done"
        });
    } else {
        response.type('json');
        response.send({
            "status": "setup"
        });
    }
});

app.listen(3000, () => {
    console.info("server listening on port 3000");
});