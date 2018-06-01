const parseTorrent = require('parse-torrent')
const fs = require('fs')
const nameToImdb = require('name-to-imdb')
const videoNameParser = require('video-name-parser')

const INTERESTING_FILE = /.mkv$|.avi$|.mp4$|.wmv$|.vp8$|.mov$|.mpg$|.mp3$|.flac$/i

function indexFile(fPath, cb) {
	if (fPath.match('\.torrent$')) indexTorrent(fPath, cb)
	else cb(null)

	// @TODO: index this; also entry.name
}

function indexTorrent(fPath, cb) {
	fs.readFile(fPath, function(err, buf) {
		if (err) return cb(err)

		let torrent
		try {
			torrent = parseTorrent(buf)
		} catch(e) {
			return cb(e)
		}

		indexParsedTorrent(torrent, cb)
	})
}

function indexParsedTorrent(torrent, cb) {
	// NOTE: torrent here may be retrieved via parse-torrent or via enginefs /create
	// enginefs /create uses parse-torrent-file, but the format between the two is almost the same (.files/.name/.infoHash are the same)

	const ih = torrent.infoHash.toLowerCase()
	const name = torrent.name

	// We assume that one torrent may have only one IMDB ID for now: this is the only way to a decent UX now

	cb(null, {
		itemId: 'bt:'+ih,
		ih: ih, 
		name: name,
		files: torrent.files,
		// @TODO: sources
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

module.exports = { indexFile, indexParsedTorrent }