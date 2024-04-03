#!/usr/bin/env python3
from dotenv import load_dotenv
import requests
import logging
import os

logger = logging.getLogger(__name__)
load_dotenv()


class Auth:
    def __init__(self):
        self.token = None
        self.get_token()

    def get_token(self):
        response = None
        try:
            response = requests.post(
                "https://id.twitch.tv/oauth2/token",
                json={
                    "client_id": os.getenv("CLIENT_ID"),
                    "client_secret": os.getenv("CLIENT_SECRET"),
                    "grant_type": "client_credentials",
                },
                headers={"content-type": "application/json"},
                timeout=10,
            )
            response.raise_for_status()
        except requests.ConnectionError as e:
            logger.error(f"error while getting auth token {e}")
            raise "token_error"
        except requests.Timeout as e:
            logger.error(f"timeout while getting auth token {e}")
            raise "token_error"
        except requests.HTTPError as e:
            logger.error(f"auth request returned wrong data {e}")
            raise "token_error"
        finally:
            if response:
                tmp_json = response.json()
                self.token = tmp_json["access_token"]
            else:
                logger.error("somehow the response object is None")
                raise "token_error"
