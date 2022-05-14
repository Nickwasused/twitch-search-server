# twitch-search-server
The reason to create this API was because of this: https://discuss.dev.twitch.tv/t/search-by-title-not-possible/33868  

# setup
1. Install the node packages by running: ```npm install```.  
2. Copy the ```.env.example``` file to ```.env``` and edit it.  
(You should at least filter for a certain language like ```de```, because we don`t want to hit API limits.)  
3. After that, launch the server with: ```node index.js.```  
  
# Fly.io
(Do the setup before!)  
(You can host this Server on [fly.io](https://fly.io/))  
4. Use fly.io Environment Variables by running: ```flyctl secrets set SECRET=TWITCH_SECRET CLIENT_ID=TWITCH_CLIENT_ID HOST=https://YOUR_URL_HERE.fly.dev LANGUAGE=LANGUAGE_TO_FILER GAME_ID=32982```  
5. Run: ```flyctl deploy```  
6. Now check the Status by running: ```flyctl status```  
7. Create a volume: ```fly volumes create twitch_search_server --region fra --size 1```
8. Visit: ```https://YOU_URL.COM/setup``` and login to twitch.  
9. The Page should show: ```status  "done"```  
10. Now you can change code at any time without having to log into twitch again.

# Instances

| Instance | User | Language | Game
| - | - | - | -
| https://twitch-search-server.nickwasused.com/ | Nickwasused | DE | 32982 (GTA 5)  
