# twitch-search-server
The reason to create this API was because of this: https://discuss.dev.twitch.tv/t/search-by-title-not-possible/33868  

# setup
1. Install [deno](https://github.com/denoland)
2. Copy ```.env.example``` to ```.env```
3. Fill in the values in ```.env```
4. Run ```deno task dev```

# Fly.io
(Do the setup before!)  
(You can host this Server on [fly.io](https://fly.io/))  
  
5. Use fly.io Environment Variables by running: ```flyctl secrets set TWITCH_LANG=de GAME_ID=32982 CLIENT_ID=YOUR_CLIENT_ID CLIENT_SECRET=YOUR_CLIENT_SECRET```  
6. Run: ```flyctl deploy```  
7. Now check the Status by running: ```flyctl status```  
8. The Page should show: ```status  "done"```  

# API Docs

[https://twitch-search-server-docs.nickwasused.com/](https://twitch-search-server-docs.nickwasused.com/)

# Instances

| Instance | User | Language | Game
| - | - | - | -
| https://twitch-search-server-de-gta5-1.nickwasused.com/ | Nickwasused | DE | 32982 (GTA 5)
| https://twitch-search-server-en-gta5.nickwasused.com/ | Nickwasused | EN | 32982 (GTA 5)
| https://twitch-search-server-de-rdr2.nickwasused.com/ | Nickwasused | DE | 493959 (Red Dead Redemtion 2)

The graphql interface is at `/graphql` e.g. [https://twitch-search-server-de-gta5-1.nickwasused.com/graphql](https://twitch-search-server-de-gta5-1.nickwasused.com/graphql)

[https://uptime.nickwasused.com/status/tss](https://uptime.nickwasused.com/status/tss)
