const path = require('path')

const consts = require('./consts')

const SUPPORTED_TYPES = ['movie', 'series']

// @TODO: this currently doesn't support finding files in bt:* entries
// it's something we can do additionally by iterating over the bt: items and checking their first file

function streamHandler(storage, args, cb) {
	if(args.id.startsWith(consts.PREFIX_LOCAL)) {
		args.id = args.id.slice(consts.PREFIX_LOCAL.length)
	}
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
				url: 'file://'+f.path,
				title: path.basename(f.path),
			})
		}
	}

	// WARNING: this here is expensive iteration; if the user has thousands of torrents, it may become a problem
	// and we might have to switch to using an index
	// quick benchmarks show that iterating over half a million items takes ~80ms on an 2017 i5
	for (let k of storage.byItemId.keys()) {
		if (k.startsWith(consts.PREFIX_BT)) {
			// for PREFIX_BT, we only care for the first, since they're all equivalent
			const entry = storage.byItemId.get(k).values().next().value

			entry.files.forEach(function(f, i) {
				if (args.type === f.type && args.id === getFileVideoId(f)) streams.push({
					title: path.basename(f.path),
					infoHash: entry.ih,
					fileIdx: i,
					id: entry.ih+'/'+i,
					sources: entry.sources
				})
			})
		}
	}

	cb(null, { streams: streams })
}

function getFileVideoId(f) {
	const segments = (f.season && f.episode) ?
		[f.imdb_id, f.season, f.episode]
		: [f.imdb_id]
	return segments.join(':')
}

module.exports = streamHandler