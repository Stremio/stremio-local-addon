const fetch = require('node-fetch')

const CINEMETA_URL = 'https://v3-cinemeta.strem.io'

function mapEntryToMeta(ENGINE_URL, entry, cb) {
	var videos = entry.files.map(mapFile.bind(null, ENGINE_URL, entry))

	// If it's not a torrent, sort videos by title; otherwise retain torrent order
	if (!entry.ih) {
		videos = videos.sort(function(a, b) { return a.title - b.title })
	}

	// We assume that one torrent may have only one IMDB ID for now: this is the only way to a decent UX now
	const imdbIdFile = entry.files.find(function(f) { return f.imdb_id })

	const genericMeta = {
		id: entry.itemId,
		type: 'other',
		name: entry.name,
		videos: videos,
		showAsVideos: true,
		// TODO: is there an easy way to pick the largest vid here? perhaps if we carry it in entry
		background: videos[0] && videos[0].thumbnail,
	}

	if (!imdbIdFile) {
		cb(null, genericMeta)
		return
	}

	fetch(CINEMETA_URL+'/meta/'+imdbIdFile.type+'/'+imdbIdFile.imdb_id+'.json')
	.then(function(resp) { return resp.json() })
	.then(function(resp) {
		if (!(resp && resp.meta)) throw 'no meta found'

		delete resp.meta.episodes
		resp.meta.videos = videos
		resp.meta.showAsVideos = true
		cb(null, resp.meta)
	})
	.catch(function(err) {
		// NOTE: not fatal, we can just fallback to genericMeta
		console.log('local-addon', imdbIdFile, err)

		cb(null, genericMeta)
	})
}

function mapFile(ENGINE_URL, entry, f, i) {
	const stream = entry.ih ? {
		infoHash: entry.ih,
		fileIdx: i,
		id: entry.ih+'/'+i,
		sources: entry.sources
	} : {
		id: 'file://'+f.path,
		url: 'file://'+f.path,
		subtitle: 'ADDON_STREAM_LOCALFILE',
	}

	return {
		id: stream.id,
		thumbnail: entry.ih ? ENGINE_URL+'/'+entry.ih+'/'+i+'/thumb.jpg' : null,
		title: f.name,
		publishedAt: new Date(), // TODO? fill this with something that makes sense
		stream: stream,
	}
}

module.exports = mapEntryToMeta
