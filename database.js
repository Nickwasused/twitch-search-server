import { MongoClient } from 'mongodb';
import dotenv from "dotenv";

dotenv.config()

const our_id = parseInt(process.env.ID);

export class Database {
    constructor() {}

    async init(collection) {
        try {
            this.client = new MongoClient(process.env.MONGO_URL);
            this.connect();
            await this.client.db("twitch-search-server").command({ ping: 1 });
        } finally {
            this.database = this.client.db("twitch-search-server");
            this.settings = this.database.collection("settings");
            this.twitch = this.database.collection("twitch");
            this.auth = this.database.collection("auth");
        }
    }

    async get_client_id() {
        let id = await this.twitch.findOne({});
        if (id == undefined || id == null) {
            console.error("There is no client_id configured for this host.");
            process.exit(1);
        } else {
            return id["CLIENT_ID"];
        }
    }
    
    async get_secret() {
        let secret = await this.twitch.findOne({});
        if (secret == undefined || secret == null) {
            console.error("There is no secret configured for this host.");
            process.exit(1);
        } else {
            return secret["SECRET"];
        }
    }
    
    async get_settings() {
        let data = await this.settings.findOne(
        {
            id: our_id 
        }, 
        { projection: {
            _id: 0
        }});
        if (data == undefined || data == null) {
            console.error("There is no settings configured for this host.");
            process.exit(1);
        } else {
            return data;
        }
        
    }

    async get_auth() {
        let data = await this.auth.findOne(
        {
            id: our_id 
        }, 
        { projection: {
            _id: 0
        }});
        if (data == undefined || data == null) {
            console.error("There is no auth configured for this host.");
            process.exit(1);
        } else {
            return data;
        }
        
    }

    async checkifauthexists() {
        let find = await this.auth.findOne({
            id: our_id
        })

        if (find == null) {
            return false
        } else {
            return true
        }
    }

    async set_auth(token, refresh) {
        const timestamp = Math.floor(new Date().getTime() / 1000);
        let check = await this.checkifauthexists();
        if (check) {
            await this.auth.updateOne({
                id: our_id
            }, {
                $set: {
                    access_token: token,
                    refresh_token: refresh,
                    time: timestamp
                }
            })
        } else {
            await this.auth.insertOne({
                id: our_id,
                access_token: token,
                refresh_token: refresh,
                time: timestamp
            })
        }
    }

    async connect() {
        await this.client.connect();
    }

    async close() {
        await this.client.close();
    }
}