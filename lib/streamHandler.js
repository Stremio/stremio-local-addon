const path = require('path')

const consts = require('./consts')

const SUPPORTED_TYPES = ['movie', 'series']

// @TODO: this currently doesn't support finding files in bt:* entries
// it's something we can do additionally by iterating over the bt: items and checking their first file

function streamHandler(storage, args, cb) {
	if (!args.id.startsWith(consts.PREFIX_IMDB) || !SUPPORTED_TYPES.includes(args.type)) {
		return cb(null, { streams: [] })
	}

	const idSplit = args.id.split(':')
	const itemIdLocal = consts.PREFIX_LOCAL + idSplit[0]

	const streams = []
	
	if (storage.byItemId.has(itemIdLocal)) {
		const entries = storage.byItemId.get(itemIdLocal)
		for (var entry of entries.values()) {
			const f = entry.files[0]
			if (args.type === f.type && args.id === getFileVideoId(f)) streams.push({
				id: 'file://'+f.path,
				url: 'file://'+f.path,
				subtitle: consts.STREAM_LOCALFILE_SUBTITLE,
				title: path.basename(f.path),
			})
		}
	}

	cb(null, { streams: streams })
}

function getFileVideoId(f) {
	const segments = (f.season && f.episode) ?
		[f.imdb_id, f.season, f.episode[0]]
		: [f.imdb_id]
	return segments.join(':')
}

module.exports = streamHandler