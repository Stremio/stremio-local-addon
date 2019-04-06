const fetch = require('node-fetch')
const consts = require('./consts')

function mapEntryToMeta(engineUrl, entry, cb) {
	// FIXME: We may have several files for the same video
	var videos = entry.files.sort(function(a, b) {
	// If it's not a torrent, sort videos; otherwise retain torrent order
	if (!entry.ih) try {
			var season = a.season - b.season;
			return season ? season : a.episode - b.episode;
		} catch(e) {}
		return 0;
	}).map(mapFile.bind(null, engineUrl, entry))

	// We assume that one torrent may have only one IMDB ID for now: this is the only way to a decent UX now
	const imdbIdFile = entry.files.find(function(f) { return f.imdb_id })

	const genericMeta = {
		id: entry.itemId,
		type: (entry.files[0] && entry.files[0].type) || 'other',
		name: (entry.files[0] && entry.files[0].parsedName) || entry.name,
		videos: videos,
		// TODO: is there an easy way to pick the largest vid here? perhaps if we carry it in entry
		background: videos[0] && videos[0].thumbnail,
	}

	if (!imdbIdFile) {
		cb(null, genericMeta)
		return
	}

	// If we have IMDB ID, first we can fill in those, then try to get the actual object from cinemeta
	genericMeta.poster = consts.METAHUB_URL+'/poster/medium/'+imdbIdFile.imdb_id+'/img'
	genericMeta.background = consts.METAHUB_URL+'/background/medium/'+imdbIdFile.imdb_id+'/img'
	genericMeta.logo = consts.METAHUB_URL+'/logo/medium/'+imdbIdFile.imdb_id+'/img'

	fetch(consts.CINEMETA_URL+'/meta/'+imdbIdFile.type+'/'+imdbIdFile.imdb_id+'.json')
	.then(function(resp) { return resp.json() })
	.then(function(resp) {
		if (!(resp && resp.meta)) throw 'No meta found. Fallback to generic meta'

		resp.meta.id = genericMeta.id
		var metaVideos = resp.meta.videos || [];
		resp.meta.videos = videos.map(function(video) {
			var mergedVideo = metaVideos.find(function(v) {
				return v.season === video.season && v.episode === video.episode
			})
			if(mergedVideo) {
				mergedVideo.id = video.id
				return mergedVideo
			}
			return video
		})
		cb(null, resp.meta)
	})
	.catch(function(err) {
		// NOTE: not fatal, we can just fallback to genericMeta
		console.log('local-addon', imdbIdFile, err)

		cb(null, genericMeta)
	})
}

function mapFile(engineUrl, entry, f) {
	const stream = entry.ih ? {
		infoHash: entry.ih,
		fileIdx: f.idx,
		title: entry.ih+'/'+f.idx,
		sources: entry.sources
	} : {
		title: f.path,
		url: 'file://'+f.path,
		subtitle: consts.STREAM_LOCALFILE_SUBTITLE,
	}

	return {
		id: entry.itemId+(f.season ? ':'+f.season+':'+f.episode : ''),
		name: f.name,
		title: entry.title,
		released: '1978-01-01T00:00:00', // FIXME: hack `released` is required
		season: f.season,
		episode: f.episode,
	}
}

module.exports = mapEntryToMeta
