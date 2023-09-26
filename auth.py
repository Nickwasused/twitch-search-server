#!/usr/bin/env python3
from dotenv import load_dotenv
import requests
import os

load_dotenv()


class Auth:
    def __init__(self):
        self.token = None
        self.get_token()

    def get_token(self):
        response = requests.post("https://id.twitch.tv/oauth2/token", json={
            'client_id': os.getenv("CLIENT_ID"),
            'client_secret': os.getenv("CLIENT_SECRET"),
            'grant_type': 'client_credentials',
        }, headers={
            "content-type": "application/json"
        })

        if response.ok:
            tmp_json = response.json()
            self.token = tmp_json["access_token"]
        else:
            raise "token_error"
