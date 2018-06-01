const fetch = require('node-fetch')

const CINEMETA_URL = 'https://v3-cinemeta.strem.io'

function mapEntryToMeta(entry, cb) {
	var videos = entry.files.map(mapFile.bind(null, entry))

	// We assume that one torrent may have only one IMDB ID for now: this is the only way to a decent UX now
	const imdbIdFile = entry.files.find(function(f) { return f.imdb_id })

	const genericMeta = {
		id: entry.itemId,
		type: 'other',
		name: entry.name,
		videos: videos,
		showAsVideos: true,
		// @TODO: background
		//background: videos[0] && videos[0].thumbnail, // TODO: largest?
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

function mapFile(entry, f, i) {
	// @TODO: normal files (path)
	var stream = {
		infoHash: entry.ih,
		fileIdx: i,
		id: entry.ih+'/'+i,
		sources: entry.sources
	}

	return {
		id: stream.id,
		// @TODO: thumbnail
		//thumbnail: f.stream.thumbnail,
		title: f.name,
		publishedAt: new Date(), // TODO? fill this with something that makes sense
		stream: stream,
	}
}

module.exports = mapEntryToMeta