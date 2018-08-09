const consts = require('./consts')

function streamHandler(storage, args, cb) {
	if (!args.id.startsWith(consts.PREFIX_IMDB)) {
		return cb(null, { streams: [] })
	}

	const itemId = consts.PREFIX_LOCAL + args.id

	if (!storage.byItemId.has(itemId)) {
		cb(null, { streams: [] })
		return
	}

	const entries = storage.byItemId.get(itemId)
	const streams = []

	for (var entry of entries.values()) {
		// can only be local files at the moment, so this map function can't be used in any other scenario (bittorrent)
		const f = entry.files[0]
		streams.push({
			id: 'file://'+f.path,
			url: 'file://'+f.path,
			subtitle: 'ADDON_STREAM_LOCALFILE',
			title: f.path,
		})
	}

	cb(null, { streams: streams })
}

module.exports = streamHandler