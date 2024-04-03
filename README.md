<h3 align="center">Twitch Search Server</h3>

<div align="center">

  [![Status](https://img.shields.io/badge/status-active-success.svg)]() 
  [![License](https://img.shields.io/github/license/nickwasused/twitch-search-server)](/LICENSE)

</div>

---

<p align="center"> Search through all livestreams on <a href="https://twitch.tv">Twitch</a>
    <br> 
</p>

## 📝 Table of Contents
- [About](#about)
- [Getting Started](#getting_started)
- [Deployment](#deployment)
- [Usage](#usage)
- [Built Using](#built_using)
- [Affiliation](#affiliation)

## 🧐 About <a name = "about"></a>
This project can host a [FastAPI](https://fastapi.tiangolo.com/) server with that you can search through all streams currently live on Twitch.

## 🏁 Getting Started <a name = "getting_started"></a>
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

`python3` is required.  
`uvicorn[standard]` is required.

### Installing

Install the required packages and uvicorn by running:
```
pip install -r requirements.txt
pip install uvicorn[standard]
```

After that copy the example Environment variables to use them:
```
cp .env.example .env
```

Now you need to fill in the missing values in the `.env` file.

## 🎈 Usage <a name="usage"></a>
Only one endpoint is available which is at the domain root `/`.  
You can filter by the following:   
`title`, `game_id`, `game_name`, `language`, `is_mature` and `type`. 

There are automatically generated docs at [http://localhost:8000/docs](http://localhost:8000/docs) or [https://tts-de-gta5.nickwasused.com/docs](https://tts-de-gta5.nickwasused.com/docs)

## 🚀 Deployment <a name = "deployment"></a>
A Dockerfile is available at [./Dockerfile](./Dockerfile)
The default listening Port is `8000`.

There is a default instance available at [https://tts-de-gta5.nickwasused.com/docs](https://tts-de-gta5.nickwasused.com/docs).
This instance is filtering for german streams playing Grand Theft Auto V.
[https://uptime.nickwasused.com/status/tss](https://uptime.nickwasused.com/status/tss)

## Style
The code is formatted and checked with [ruff](https://github.com/astral-sh/ruff)s default settings.

## ⛏️ Built Using <a name = "built_using"></a>
- [FastAPI](https://fastapi.tiangolo.com/) - API Framework
- [Uvicorn](https://www.uvicorn.org/) - ASGI web server

### Affiliation <a name = "affiliation"></a>
I am not affiliated with Twitch Interactive, Inc.