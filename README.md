# twitch-search-server
The reason to create this API was because of this: https://discuss.dev.twitch.tv/t/search-by-title-not-possible/33868  

# setup
1. Install the node packages by running: ```npm install```.  
2. Setup a Mongo DB Server with the following layout:
Database: "twitch-search-server"  

| Collection | - 
| - | - 
| auth | leave this empty
| settings | create a entry with the layout below (1)
| twitch | create a single enty with the layout below (2)
  
(1)
| name | value | example
| - | - | -
| id | this is the id of your search server. You specify this in the .env file | 1, 2, 3
| LANGUAGE | the server filters for this language | "de"
| GAME_ID | the server filters for this game id | 32982
| HOST | this is the url where you server is hosted at | "http://localhost:3000"
| INTERVAL_IN_MIN | this is the interval of the streams fetcher | 1
  
(2)
| name | value | example
| - | - | -
| CLIENT_ID | this is the client id of your twitch Applications | random string
| SECRET | this is the secret id of your twitch Applications | random string
  
3. Copy the ```.env.example``` file to ```.env``` and edit it.  
4. After that, launch the server with: ```node index.js.```  
  

# Fly.io
(Do the setup before!)  
(You can host this Server on [fly.io](https://fly.io/))  
  
5. Use fly.io Environment Variables by running: ```flyctl secrets set ID=YOUR_ID MONGO_URL=YOUR_MONGO_URL```  
6. Run: ```flyctl deploy```  
7. Now check the Status by running: ```flyctl status```  
8. Visit: ```https://YOU_URL.COM/setup``` and login to twitch.  
9. The Page should show: ```status  "done"```  
10. Now you can change code at any time without having to log into twitch again.

# API Docs

https://nickwasused.com/twitch-search-server/

# Instances

| Instance | User | Language | Game | Uptime |Node Status
| - | - | - | - | - | -
| https://twitch-search-server.nickwasused.com/ | Nickwasused | DE | 32982 (GTA 5) | ![Uptime](https://img.shields.io/uptimerobot/ratio/m791355715-cb0f5288f833744c7fb2b816?style=for-the-badge) | ![Status](https://img.shields.io/badge/dynamic/json?label=Status&query=status&url=https%3A%2F%2Ftwitch-search-server.nickwasused.com%2Fsearch?cacheSeconds=3600)
| https://twitch-search-server-en.nickwasused.com/ | Nickwasused | EN | 32982 (GTA 5) | ![Uptime](https://img.shields.io/uptimerobot/ratio/m791828321-1d8398a4dece3d0908cd3fff?style=for-the-badge) | ![Status](https://img.shields.io/badge/dynamic/json?label=Status&query=status&url=https%3A%2F%2Ftwitch-search-server-en.nickwasused.com%2Fsearch?cacheSeconds=3600)



