type Twitch_Api_Token = {
    access_token: string,
    expires_in: number,
    token_type: string
}

export class Auth {
    public token: string | undefined;
    private client_id: string;
    private client_secret: string;

    constructor(client_id: string, client_secret: string) {
        this.token = undefined;
        this.client_id = client_id;
        this.client_secret = client_secret;
    }

    public async get_token() {
        const token_url = "https://id.twitch.tv/oauth2/token";
        const headers = new Headers({ "content-type": "application/json" });
        const api_response = await fetch(token_url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                "client_id": this.client_id,
                "client_secret": this.client_secret,
                "grant_type": "client_credentials"
            })
        })
        if (api_response.ok) {
            const token: Twitch_Api_Token = await api_response.json();
            console.info("got a access token")
            this.token = token["access_token"]
        } else {
            console.warn("couldn`t get token")
        }
    }
}