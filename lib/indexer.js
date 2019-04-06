const parseTorrent = require('parse-torrent')
const fs = require('fs')
const path = require('path')
const nameToImdb = require('name-to-imdb')
const videoNameParser = require('video-name-parser')
const promisify = require('util').promisify
const consts = require('./consts')

function indexFile(fPath, cb) {
	if (fPath.match('\.torrent$')) {
		indexTorrent(fPath, cb)
		return
	}

	if (!fPath.match(consts.INTERESTING_FILE)) {
		cb(null, { files: [] })
		return
	}

	fs.stat(fPath, function(err, stat) {
		if (err) return cb(err)

		let file = {
			path: fPath,
			name: path.basename(fPath),
			length: stat.size,
		}

		processFile(file, function(err, f) {
			if (err) return cb(err)

			// Those files are only interesting if they map to an IMDB ID
			if (!f.imdb_id) return cb(null, { files: [] })
			else return cb(null, {
				itemId: consts.PREFIX_LOCAL+f.imdb_id,
				name: f.name,
				files: [f],
			})
		})
	})
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

	const files = torrent.files.map(function(f, i) {
		f.idx = i
		return f
	}).filter(function(x) {
		return x.path.match(consts.INTERESTING_FILE)
	})

	if (!files.length) {
		cb(null, { files: [] })
		return
	}

	const procFile = promisify(processFile)

	Promise.all(files.map(f => procFile(f)))
	.then(function(processedFiles) {
		cb(null, {
			itemId: 'bt:'+ih,
			ih: ih,
			name: name,
			files: processedFiles,
			sources: torrent.announce ? getSources(torrent) : null,
		})
	})
	.catch(cb)
}

function processFile(f, cb) {
	var parsed = videoNameParser(f.path, {
		strict: true,
		fromInside: true,
		fileLength: f.length
	})

	if (!consts.INTERESTING_TYPE.includes(parsed.type)) {
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
			f.parsedName = parsed.name
			f.type = parsed.type
			f.imdb_id = imdbId
			if (parsed.season) {
				f.season = parsed.season
				f.episode = [].concat(parsed.episode).shift()
			}
		}

		cb(null, f)
	})
}

function getSources(t) {
	return [ 'dht:'+t.infoHash ]
	.concat(t.announce.map(function(x) { return 'tracker:'+x }))
}


module.exports = {
	indexFile,
	indexParsedTorrent
}
