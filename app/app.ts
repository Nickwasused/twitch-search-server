// @deno-types="./app.d.ts"
import { Server } from 'https://deno.land/std@0.192.0/http/server.ts';
import 'https://deno.land/std@0.192.0/dotenv/load.ts';
import { GraphQLHTTP } from 'https://deno.land/x/gql@1.1.2/mod.ts';
import { makeExecutableSchema } from 'https://deno.land/x/graphql_tools@0.0.2/mod.ts';
import { gql } from 'https://deno.land/x/graphql_tag@0.1.1/mod.ts';
import { Auth } from './auth.ts';
import { Config } from './config.ts';
import * as log from "https://deno.land/std@0.192.0/log/mod.ts";

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
			log.error(error);
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
			log.error(
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
				log.info(`done fetching ${streams.length} streams`);
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

const Streamers = async (args: any, only_viewers: boolean = false, only_streamers: boolean = false) => {
	const params = args;

	if (Object.keys(params).length == 0) {
		return streams;
	}

	const filters: Filter = {};
	// convert params with multiple values to array
	search_params.forEach((param) => {
		if (params[param]) {
			filters[param] = params[param]?.split(',') ?? [];
		}
	});

	const streamers =  streams.filter((stream: Streamer) => {
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

	if (!only_viewers && !only_streamers) {
		return streamers
	} else if (only_viewers) {
		const viewerCount = streamers.map(obj => obj.viewer_count);
		const totalViewerCount = viewerCount.reduce((acc, count) => acc + count, 0);
		return totalViewerCount
	} else if (only_streamers) {
		return streamers.length
	}
};

// startup fetch and interval setup
// 1 minute interval
await get_streams();
const _fetch_interval: number = setInterval(
	get_streams.bind(this),
	1 * 60 * 1000,
);

const typeDefs = gql`
	type Query {
		Streamers(id: ID, user_id: String, user_login: String, user_name: String, game_id: String, game_name: String, type: String, title: String, viewer_count: Int, started_at: String, language: String, thumbnail_url: String, is_mature: Boolean): [Streamer!]
		getViewerCount(id: ID, user_id: String, user_login: String, user_name: String, game_id: String, game_name: String, type: String, title: String, viewer_count: Int, started_at: String, language: String, thumbnail_url: String, is_mature: Boolean): Int
		getStreamerCount(id: ID, user_id: String, user_login: String, user_name: String, game_id: String, game_name: String, type: String, title: String, viewer_count: Int, started_at: String, language: String, thumbnail_url: String, is_mature: Boolean): Int
  	}

	type Streamer {
		id: ID!
		user_id: String!
		user_login: String!
		user_name: String!
		game_id: String
		game_name: String
		type: String
		title: String
		viewer_count: Int
		started_at: String
		language: String
		thumbnail_url: String
		tag_ids: [String!]
		tags: [String!]
		is_mature: Boolean
	}
`;

const resolvers = {
	Query: {
		Streamers: (_: any, args: any) => Streamers(args, false, false),
		getViewerCount: (_: any, args: any) => Streamers(args, true, false),
		getStreamerCount: (_: any, args: any) => Streamers(args, false, true),
	},
};

const schema = makeExecutableSchema({ resolvers, typeDefs });

const server = new Server({
	handler: async (req: any) => {
		const { pathname } = new URL(req.url);

		let res: Response;

		if (pathname === '/graphql') {
			res = req.method === 'OPTIONS'
				? new Response(undefined, { status: 204, headers: { Allow: 'OPTIONS, GET, POST' } })
				: await GraphQLHTTP<Request>({
					schema,
					graphiql: true,
				})(req);
		} else {
			res = req.method === 'OPTIONS'
				? new Response(undefined, { status: 204, headers: { Allow: '*' } })
				: new Response('Not Found', { status: 404 });
		}

		res.headers.append('access-control-allow-origin', '*');
		res.headers.append('access-control-allow-headers', 'Origin, Host, Content-Type, Accept');

		return res;
	},
	port: 8000,
});

server.listenAndServe();

log.info(`☁  Started on http://localhost:8000`);
