# twitch-search-server
The reason to create this API was because of this: https://discuss.dev.twitch.tv/t/search-by-title-not-possible/33868  

# setup
1. Install python3
2. Install the requirements ```pip3 install -r requirements.txt```
3. Copy ```.env.example``` to ```.env```
4. Fill in the values in ```.env```
5. Run ```python app.py```

# Fly.io
(Do the setup before!)  
(You can host this Server on [fly.io](https://fly.io/))  
  
5. Use fly.io Environment Variables by running: ```flyctl secrets set TWITCH_LANG=de GAME_ID=32982 CLIENT_ID=YOUR_CLIENT_ID CLIENT_SECRET=YOUR_CLIENT_SECRET```  
6. Run: ```flyctl deploy```  
7. Now check the Status by running: ```flyctl status```  
8. The Page should show: ```status  "done"```  

# API Docs

The search is available at the root "/". You can search using the argument "search". Example "https://tts-de-gta5.nickwasused.com/?search=deutsch"

# Instances

| Instance | User | Language | Game
| - | - | - | -
| https://tts-de-gta5.nickwasused.com/ | Nickwasused | DE | 32982 (GTA 5)


[https://uptime.nickwasused.com/status/tss](https://uptime.nickwasused.com/status/tss)
