import express from 'express';
import compression from 'compression';
import NodeCache from 'node-cache';
import utils from './utils.js';
import { SearchHandler } from './search.js';
import { Database } from './database.js';

const cache = new NodeCache({ stdTTL: 30 });

const app = express();
const exporter = express();
app.use(compression());
exporter.use(compression());

const database = new Database();
await database.init();
const search = new SearchHandler();
await search.init();

// auth stuff
let settings_object = await database.get_settings();
let client_id = await database.get_client_id()
await database.close();
let host = settings_object["HOST"];


app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    next();
});

app.use(function(req, res, next) {
    try {
        const cache_id = JSON.stringify(req.query);
        if (cache.has(cache_id)) {
            return res.status(200).json({
                "status": "done",
                "data": cache.get(cache_id)
            });
        }
        return next();
    } catch (err) {
        throw new Error(err);
    }
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
                let local_pass= false;
                let values = filter.value.split(",");
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

        cache.set(JSON.stringify(request.query), api_response);
        response.send({
            "status": "done",
            "data": api_response
        });
    } else {
        response.type('json');
        response.status(401);
        response.send({
            "status": "setup"
        });
    }
});

app.get("/tags", (request, response) => {
    if (search.setup_done) {
        response.type('json');

        let api_response = search.tags;

        cache.set(JSON.stringify(request.query), api_response);
        response.send({
            "status": "done",
            "data": api_response
        });
    } else {
        response.type('json');
        response.status(401);
        response.send({
            "status": "setup"
        });
    }
});

app.get("/code", (request, response) => {
    response.type('json');
    let code = request.query.code;
    let state = request.query.state;
    if (state != cache.take(`state:${request.ip}`)) {
        console.log("wrong state returned");
        response.status(403);
        response.send({
            "status": "error"
        });
    } else {
        let token_gen = search.get_auth_token(code);
        if (token_gen) {
            search.setup_done = true;
        }
        if (code == undefined) {
            response.status(500);
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
        cache.set(`state:${request.ip}`, state);
        cache.ttl(`state:${request.ip}`, 300);
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
        response.status(401);
        response.send({
            "status": "setup"
        });
    }
});

exporter.get("/metrics", (request, response) => {
    response.type('text/plain');
    response.send(`# TYPE total_streams gauge
total_streams ${search.streams.length}
# TYPE rate_limit_remaining gauge
rate_limit_remaining ${search.rate_limit_remaining}
    `);
});

exporter.listen(9210, () => {
    console.info("Exporter listening on port 9210");
});

app.listen(3000, async () => {
    console.info("server listening on port 3000");
});