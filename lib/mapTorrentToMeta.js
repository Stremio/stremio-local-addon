const nameToImdb = require('name-to-imdb')
const videoNameParser = require('video-name-parser')

const INTERESTING_VIDEO = /.mkv$|.avi$|.mp4$|.wmv$|.vp8$|.mov$|.mpg$|.mp3$|.flac$/i

function mapTorrentToMeta(torrent, cb) {
	// NOTE: torrent here may be retrieved via parse-torrent or via enginefs /create
	// enginefs /create uses parse-torrent-file, but the format between the two is almost the same (.files/.name are the same)
	console.log(torrent.files, torrent.name)

	// We assume that one torrnet may have only one IMDB ID for now: this is the only way to a decent UX now
	
	// @TODO: check how does name-to-imdb queue work here, and whether it's a smart idea to do tihs
	torrent.files.forEach(function(f) {
		var parsed = videoNameParser(f.path, { strict: true, fromInside: false, fileLength: f.length })

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