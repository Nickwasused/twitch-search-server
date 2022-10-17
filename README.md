# twitch-search-server
The reason to create this API was because of this: https://discuss.dev.twitch.tv/t/search-by-title-not-possible/33868  

# setup
1. Install [deno](https://github.com/denoland)
2. Copy ```.env.example``` to ```.env```
3. Fill in the values in ```.env```
4. Run ```deno run --allow-net --allow-read --allow-env .\index.ts```

# Fly.io
(Do the setup before!)  
(You can host this Server on [fly.io](https://fly.io/))  
  
5. Use fly.io Environment Variables by running: ```flyctl secrets set TWITCH_LANG=de GAME_ID=32982 CLIENT_ID=YOUR_CLIENT_ID CLIENT_SECRET=YOUR_CLIENT_SECRET```  
6. Run: ```flyctl deploy```  
7. Now check the Status by running: ```flyctl status```  
8. The Page should show: ```status  "done"```  

# API Docs

[https://nickwasused.github.io/twitch-search-server/](https://nickwasused.github.io/twitch-search-server/)

# Instances

| Instance | User | Language | Game | Uptime
| - | - | - | - | -
| https://twitch-search-server.nickwasused.com/ | Nickwasused | DE | 32982 (GTA 5) | ![Uptime](https://img.shields.io/uptimerobot/ratio/m791355715-cb0f5288f833744c7fb2b816?style=for-the-badge)
| https://twitch-search-server-de-rdr2.nickwasused.com/ | Nickwasused | DE | 493959 (Red Dead Redemtion 2) | ![Uptime](https://img.shields.io/uptimerobot/ratio/m792346611-5b5ca66a0aba9a70f1565cc4?style=for-the-badge)
| https://twitch-search-server-en.nickwasused.com/ | Nickwasused | EN | 32982 (GTA 5) | ![Uptime](https://img.shields.io/uptimerobot/ratio/m791828321-1d8398a4dece3d0908cd3fff?style=for-the-badge)
