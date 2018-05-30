const nameToImdb = require('name-to-imdb')
const videoNameParser = require('video-name-parser')

const INTERESTING_VIDEO = /.mkv$|.avi$|.mp4$|.wmv$|.vp8$|.mov$|.mpg$|.mp3$|.flac$/i

function mapTorrentToMeta(torrent, cb) {
	// NOTE: torrent here may be retrieved via parse-torrent or via enginefs /create
	// enginefs /create uses parse-torrent-file, but the format between the two is almost the same (.files/.name/.infoHash are the same)
	
	// We assume that one torrnet may have only one IMDB ID for now: this is the only way to a decent UX now

	var ih = torrent.infoHash.toLowerCase()
	var name = torrent.name
	var videos = torrent.files
	.map(function(f, i) {
		var stream = {
			infoHash: ih,
			fileIdx: i,
			id: ih+'/'+i,
			// @TODO: sources
			//sources: getSources(this)
		}
		return { 
			id: stream.id,
			// @TODO: thumbnail
			//thumbnail: f.stream.thumbnail,
			title: f.name,
			publishedAt: new Date(), // TODO? fill this with something that makes sense
			stream: stream,
		}
	})

	cb(null, {
		id: 'bt:'+ih,
		type: 'other',
		name: name,
		videos: videos,
		showAsVideos: true,
		// @TODO: background
		//background: videos[0] && videos[0].thumbnail, // TODO: largest?
	})

	// @TODO
	// @TODO: check how does name-to-imdb queue work here, and whether it's a smart idea to do tihs
	torrent.files.forEach(function(f) {
		var parsed = videoNameParser(f.path, { strict: true, fromInside: false, fileLength: f.length })

		// @TODO: filter
		// @TODO: season/episode props

		if (parsed.type === 'movie' || parsed.type === 'series') nameToImdb({
			name: parsed.name,
			year: parsed.year,
			type: parsed.type,
		}, function(err, imdbId) {
			console.log(err, parsed, imdbId)
		})
	})
}

module.exports = mapTorrentToMeta