const fetch = require('node-fetch')

const indexer = require('./indexer')
const mapEntryToMeta = require('./mapEntryToMeta')
const consts = require('./consts')

function metaHandler(storage, metaStorage, engineUrl, args, cb) {
	let entry = storage.getAggrEntry('itemId', args.id, ['files'])
	if(!entry && args.id.startsWith(consts.PREFIX_BT)) {
		entry = getNonIndexedTorrent(engineUrl, args.id.slice(consts.PREFIX_BT.length))
	}
	if(!entry) {
		return cb(null, null);
	}
	Promise.resolve(entry)
	.then(function(entry) {
		const videos = entry.files.sort(function(a, b) {
			// If we have season and episode, sort videos; otherwise retain the order
			try {
				return a.season - b.season || a.episode - b.episode;
			} catch(e) {}
			return 0;
		}).map(mapFile.bind(null, entry, new Date().getTime()))

		return Promise.resolve(metaStorage.indexes.primaryKey.get(entry.itemId))
		.then(function(meta) {
			return meta || mapEntryToMeta(entry)
		})
		.then(function(meta) {
			meta.videos = videos
			cb(null, { meta: meta })
		});
	})
	.catch(function(err) {
		console.log(err)
		cb(null, null)
	})
}

function getNonIndexedTorrent(engineUrl, ih) {
	return fetch(engineUrl+'/'+ih+'/create', { method: 'POST' })
	.then(function(resp) { return resp.json() })
	.then(function(torrent) {
		return new Promise(function(resolve, reject) {
			// torrent.announce = (torrent.sources || []).map(function(source) {
			// 	return source.url.startsWith('tracker:') ? source.url.substr(8) : source.url
			// })
			indexer.indexParsedTorrent(torrent, function(err, entry) {
				if (err) return reject(err)
				if (!entry) return reject(new Error('internal err: no entry from indexParsedTorrent'))
				resolve(entry);
			})
		})
	})
}

function mapFile(entry, uxTime, file, index) {
	const stream = entry.ih ? {
		infoHash: entry.ih,
		fileIdx: file.idx,
		title: entry.ih + '/' + file.idx,
		sources: entry.sources
	} : {
		title: file.path,
		url: 'file://'+file.path,
		subtitle: consts.STREAM_LOCALFILE_SUBTITLE,
	}
	const videoId = [file.imdb_id, file.season, file.episode].filter(x => x).join(':')
	const thumbnail = file.season && file.episode
			? `${consts.METAHUB_EPISODES_URL}/${file.imdb_id}/${file.season}/${file.episode}/w780.jpg`
			: `${consts.METAHUB_URL}/background/medium/${file.imdb_id}/img`
	return {
		id: videoId,
		// We used to have a thumbnail here.
		// This caused downloading of all episodes in order to be generated a preview.
		title: file.name,
		publishedAt: entry.dateModified || new Date(),
		// The videos in the UI are sorted by release date. Newest at top.
		// For local files we want oldest at top
		released: new Date(uxTime - index * 60000),
		stream: stream,
		season: file.season,
		episode: file.episode,
		thumbnail: thumbnail
	}
}

module.exports = metaHandler