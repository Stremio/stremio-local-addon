const parseTorrent = require('parse-torrent')
const fs = require('fs')
const nameToImdb = require('name-to-imdb')
const videoNameParser = require('video-name-parser')
const promisify = require('util').promisify

const INTERESTING_FILE = /.mkv$|.avi$|.mp4$|.wmv$|.vp8$|.mov$|.mpg$|.mp3$|.flac$/i
const INTERESTING_TYPE = ['movie', 'series']

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

	const files = torrent.files.filter(function(x) {
		return x.path.match(INTERESTING_FILE)
	})

	const procFile = promisify(processFile)

	Promise.all(files.map(f => procFile(f)))
	.then(function(processedFiles) {
		cb(null, {
			itemId: 'bt:'+ih,
			ih: ih, 
			name: name,
			files: processedFiles,
			// @TODO: sources
		})
	})
	.catch(cb)
}

function processFile(f, cb) {
	var parsed = videoNameParser(f.path, {
		strict: true,
		fromInside: false,
		fileLength: f.length
	})

	if (!INTERESTING_TYPE.includes(parsed.type)) {
		return cb(null, f)
	}

	// NOTE: nameToImdb has a built-in queue, we don't need to worry about concurrency
	nameToImdb({
		name: parsed.name,
		year: parsed.year,
		type: parsed.type,
	}, function(err, imdbId) {
		// NOTE: the error here is totally ignored, as this is not fatal
		if (imdbId) {			
			f.type = parsed.type
			f.imdb_id = imdbId
			if (parsed.season) {
				f.season = parsed.season
				f.episode = parsed.episode
			}
		}

		cb(null, f)
	})
}

module.exports = {
	indexFile,
	indexParsedTorrent 
}