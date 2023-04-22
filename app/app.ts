// @deno-types="./app.d.ts"
import { Application, context, helpers, Status } from 'https://deno.land/x/oak@v12.2.0/mod.ts';
import 'https://deno.land/std@0.184.0/dotenv/load.ts';
import { Auth } from './auth.ts';
import { Config } from './config.ts';

const app = new Application();
// load config
const config = new Config();
// initialize twitch auth
const auth = new Auth(config.client_id, config.client_secret);

await auth.get_token();
if (auth.token == undefined) {
	Deno.exit(1);
}

let streams: Streamer[] = [];

/**
 * Remove duplicates from a Streams Array
 * @returns {Array[Streamer]} Streams Array without Duplicates
 */
function deduplicate_streams(array: Streamer[]) {
	const uniqueIds = new Set<string>();
	return array.filter((element) => {
		if (!uniqueIds.has(element.id)) {
			uniqueIds.add(element.id);
			return element;
		}
	});
}

/**
 * Get all Streams with the set `lang` and `game_id`
 * @returns {array<Streamer>} Array of Streamers
 * @see {@link Streamer}
 */
async function get_streams() {
	const streams_url = 'https://api.twitch.tv/helix/streams';
	const tempstreams: Streamer[] = [];
	const headers = new Headers({
		'content-type': 'application/json',
		'client-id': config.client_id,
		'Authorization': `Bearer ${auth.token}`,
	});
	let fetching = true;
	let paginator: pagination = {};

	while (fetching) {
		let url = `${streams_url}?first=100&type=live&language=${config.lang}&game_id=${config.game_id}`;
		if (paginator.cursor) {
			url = `${url}&after=${paginator.cursor}`;
		}

		let current_streams;

		try {
			current_streams = await fetch(url, {
				headers: headers,
			});
		} catch (error) {
			console.error(error);
			fetching = false;
			continue;
		}

		if (current_streams.status == 401) {
			// get a new token
			await auth.get_token();
			continue;
		}

		const tmp_stream_data: Twitch_Api_Streams = await current_streams.json();
		if (tmp_stream_data == undefined) {
			fetching = false;
			console.error(
				`done fetching ${tempstreams.length} streams, but with an error!`,
			);
			streams = tempstreams;
		} else {
			// merge streams
			tempstreams.splice(tempstreams.length, 0, ...tmp_stream_data.data);

			// if there are no more streams
			if (
				tmp_stream_data.pagination.cursor == undefined ||
				tmp_stream_data.pagination.cursor == 'IA'
			) {
				fetching = false;
				streams = deduplicate_streams(tempstreams);
				console.info(`done fetching ${streams.length} streams`);
			} else {
				paginator = tmp_stream_data.pagination;
			}
		}
	}
}

const search_params: string[] = [
	'id',
	'user_id',
	'user_login',
	'user_name',
	'game_id',
	'game_name',
	'type',
	'title',
	'viewer_count',
	'started_at',
	'language',
	'thumbnail_url',
	'tag_ids',
	'tags',
	'is_mature',
];

// startup fetch and interval setup
// 1 minute interval
await get_streams();
const _fetch_interval: number = setInterval(
	get_streams.bind(this),
	1 * 60 * 1000,
);

app.use((ctx: context.request, next: context.response) => {
	// set default headers
	ctx.response.headers.set('Access-Control-Allow-Origin', `*`);
	ctx.response.headers.set('Access-Control-Allow-Methods', `GET`);
	ctx.response.headers.set(
		'X-Robots-Tag',
		`noindex, nofollow, noarchive, notranslate`,
	);

	// check if the request type is GET
	if (ctx.request.method != 'GET') {
		ctx.response.status = Status.MethodNotAllowed;
		return;
	} else {
        ctx.response.status = Status.OK;
		next();
	}
});

app.use((ctx: context.request) => {
	const params: Params = helpers.getQuery(ctx, { mergeParams: true });

	// we don`t want to return all streams when no filters are defined!
	if (Object.keys(params).length == 0) {
		ctx.response.type = 'text/plain';
		ctx.response.headers.set('Cache-Control', `public, max-age=600`);
		ctx.response.body = `Please use the following filters: ${search_params}`;
		return;
	}

	const filters: Filter = {};
	// convert params with multiple values to array
	search_params.forEach((param) => {
		if (params[param]) {
			filters[param] = params[param]?.split(',') ?? [];
		}
	});

	const api_response: Streamer[] = streams.filter((stream: Streamer) => {
		// https://stackoverflow.com/questions/52489741/filter-json-object-array-on-multiple-values-or-arguments-javascript
		const return_stream = Object.keys(filters).every((key) => {
			for (let i = 0; i < filters[key].length; i++) {
				if (filters[key][i] == '') return false;
				if (
					stream[key as keyof typeof stream].toString().toLowerCase().includes(
						filters[key][i].toString().toLowerCase(),
					) || stream[key as keyof typeof stream] == filters[key][i]
				) {
					return true;
				}
			}
		});
		return return_stream;
	});

	ctx.response.type = 'json';
	ctx.response.headers.set('Cache-Control', `public, max-age=60`);

	if (api_response.length != 0) {
		ctx.response.body = JSON.stringify(api_response);
		return;
	} else {
		ctx.response.body = '[]';
		return;
	}
});

await app.listen({ port: config.listen_port });
