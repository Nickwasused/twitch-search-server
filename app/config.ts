export class Config {
	private server_config: Record<string, string> = Deno.env.toObject();
	public client_id: string;
	public client_secret: string;
	public lang: string;
	public game_id: string;
	public listen_port: number;

	constructor() {
		this.client_id = this.server_config['CLIENT_ID'];
		this.client_secret = this.server_config['CLIENT_SECRET'];
		this.lang = this.server_config['TWITCH_LANG'];
		this.game_id = this.server_config['GAME_ID'];
		this.listen_port = parseInt(this.server_config['PORT'] ?? '8000');

		if (!this.valid_config()) {
			console.error('the config is invalid!');
			Deno.exit(1);
		}
	}

	private valid_config(): boolean {
		if (
			this.client_id == undefined || this.client_secret == undefined ||
			this.lang == undefined || this.game_id == undefined
		) {
			return false;
		} else {
			return true;
		}
	}
}
