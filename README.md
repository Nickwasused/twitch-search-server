# twitch-search-server
The reason to create this API was because of this https://discuss.dev.twitch.tv/t/search-by-title-not-possible/33868

# setup
1. Install the node packages by running: ```npm install```.  
2. Copy the ```.env.example``` file to ```.env``` and edit it.  
3. After that, launch the server with: ```node index.js.```  
  
# Fly.io
(Do the setup before!)
(You can host this Server on [fly.io](https://fly.io/))
4. Use fly.io Enviroment Variables by running: ```flyctl secrets set SECRET=TWITCH_SECRET HOST=https://YOUR_URL_HERE.fly.dev LANGUAGE=LANGUAGE_TO_FILER GAME_ID=32982```
5. Run: ```flyctl deploy```
6. Now check the Status by running: ```flyctl status```
